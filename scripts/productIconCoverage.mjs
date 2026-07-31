import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

import ts from 'typescript'
import { parse } from 'vue/compiler-sfc'

const PRODUCT_ICON_VARIABLE = 'productIconCollections'
const ICON_PROPERTY_NAMES = new Set(['icon', 'preIcon'])
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue'])
const ICON_NAME_PATTERN = /\b([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9][a-z0-9_/-]*)\b/gi

const normalizePath = (path) => path.split(sep).join('/')
const normalizeExpression = (expression) => expression.replace(/\s+/g, ' ').trim()
const sortStrings = (values) => [...values].sort((left, right) => left.localeCompare(right))

const unwrapExpression = (node) => {
  let current = node
  while (
    current &&
    (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isSatisfiesExpression(current))
  ) {
    current = current.expression
  }
  return current
}

const propertyName = (property) => {
  const name = property?.name
  if (!name) return undefined
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name)) {
    return name.text
  }
  return undefined
}

const objectProperty = (object, name) =>
  object.properties.find((property) => propertyName(property) === name)

const stringValue = (node, label) => {
  const value = unwrapExpression(node)
  if (!value || !ts.isStringLiteralLike(value)) {
    throw new Error(`${label} must be a string literal`)
  }
  return value.text
}

const objectValue = (node, label) => {
  const value = unwrapExpression(node)
  if (!value || !ts.isObjectLiteralExpression(value)) {
    throw new Error(`${label} must be an object literal`)
  }
  return value
}

export const readProductIconManifest = ({ root, manifestPath }) => {
  const absoluteManifestPath = resolve(root, manifestPath)
  const source = readFileSync(absoluteManifestPath, 'utf8')
  const sourceFile = ts.createSourceFile(
    absoluteManifestPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )

  let initializer
  const findManifest = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === PRODUCT_ICON_VARIABLE
    ) {
      initializer = unwrapExpression(node.initializer)
      return
    }
    ts.forEachChild(node, findManifest)
  }
  findManifest(sourceFile)

  if (!initializer || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${PRODUCT_ICON_VARIABLE} must be an array literal in ${manifestPath}`)
  }

  const iconNames = new Set()
  const prefixes = new Set()
  for (const [index, element] of initializer.elements.entries()) {
    const collection = objectValue(element, `collection ${index}`)
    const prefixProperty = objectProperty(collection, 'prefix')
    const iconsProperty = objectProperty(collection, 'icons')
    if (!prefixProperty || !ts.isPropertyAssignment(prefixProperty)) {
      throw new Error(`collection ${index} is missing prefix`)
    }
    if (!iconsProperty || !ts.isPropertyAssignment(iconsProperty)) {
      throw new Error(`collection ${index} is missing icons`)
    }

    const prefix = stringValue(prefixProperty.initializer, `collection ${index} prefix`)
    const icons = objectValue(iconsProperty.initializer, `collection ${prefix} icons`)
    prefixes.add(prefix)
    for (const icon of icons.properties) {
      const name = propertyName(icon)
      if (name) iconNames.add(`${prefix}:${name}`)
    }

    const aliasesProperty = objectProperty(collection, 'aliases')
    if (aliasesProperty && ts.isPropertyAssignment(aliasesProperty)) {
      const aliases = objectValue(aliasesProperty.initializer, `collection ${prefix} aliases`)
      for (const alias of aliases.properties) {
        const name = propertyName(alias)
        if (name) iconNames.add(`${prefix}:${name}`)
      }
    }
  }

  return {
    iconNames,
    prefixes
  }
}

const iconNamesFromText = (text) => {
  const names = []
  for (const match of text.matchAll(ICON_NAME_PATTERN)) names.push(`${match[1]}:${match[2]}`)
  return names
}

const addIconNames = (text, state, { knownPrefixesOnly = false } = {}) => {
  const names = iconNamesFromText(text)
  for (const name of names) {
    const [prefix] = name.split(':', 1)
    if (knownPrefixesOnly && prefix !== 'svg-icon' && !state.manifestPrefixes.has(prefix)) continue
    if (prefix === 'svg-icon') state.localSvgNames.add(name)
    else state.iconNames.add(name)
  }
  return names.length
}

const addDynamicBinding = (file, expression, state) => {
  const normalized = normalizeExpression(expression)
  if (!normalized) return
  state.dynamicBindings.set(`${file}\0${normalized}`, { file, expression: normalized })
}

const scanIconExpression = (file, expression, state) => {
  if (addIconNames(expression, state) === 0) addDynamicBinding(file, expression, state)
}

const scanTemplateNode = (node, file, state) => {
  if (node.type === 1) {
    for (const property of node.props) {
      if (property.type === 7 && property.exp?.type === 4) {
        addIconNames(property.exp.content, state, { knownPrefixesOnly: true })
      }
    }
  }

  if (node.type === 1 && node.tag === 'Icon') {
    for (const property of node.props) {
      if (property.type === 6 && property.name === 'icon') {
        if (property.value) addIconNames(property.value.content, state)
        continue
      }
      if (
        property.type === 7 &&
        property.name === 'bind' &&
        property.arg?.type === 4 &&
        property.arg.isStatic &&
        property.arg.content === 'icon' &&
        property.exp?.type === 4
      ) {
        scanIconExpression(file, property.exp.content, state)
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) scanTemplateNode(child, file, state)
  }
  if (Array.isArray(node.branches)) {
    for (const branch of node.branches) scanTemplateNode(branch, file, state)
  }
}

const scanScript = (source, file, state, scriptKind = ts.ScriptKind.TSX) => {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind)

  const visit = (node) => {
    if (ts.isStringLiteralLike(node)) {
      addIconNames(node.text, state, { knownPrefixesOnly: true })
    }

    if (ts.isPropertyAssignment(node) && ICON_PROPERTY_NAMES.has(propertyName(node))) {
      addIconNames(node.initializer.getText(sourceFile), state)
    }

    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (node.tagName.getText(sourceFile) === 'Icon') {
        for (const attribute of node.attributes.properties) {
          if (!ts.isJsxAttribute(attribute) || propertyName(attribute) !== 'icon') continue
          if (!attribute.initializer) continue
          if (ts.isStringLiteral(attribute.initializer)) {
            addIconNames(attribute.initializer.text, state)
          } else if (
            ts.isJsxExpression(attribute.initializer) &&
            attribute.initializer.expression
          ) {
            scanIconExpression(file, attribute.initializer.expression.getText(sourceFile), state)
          }
        }
      }
    }

    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

const scanModule = (absolutePath, file, state) => {
  const source = readFileSync(absolutePath, 'utf8')
  if (file.endsWith('.vue')) {
    const { descriptor, errors } = parse(source, { filename: file })
    if (errors.length > 0) {
      throw new Error(`failed to parse ${file}: ${errors.map(String).join('; ')}`)
    }
    if (descriptor.template?.ast) scanTemplateNode(descriptor.template.ast, file, state)
    if (descriptor.script) scanScript(descriptor.script.content, file, state)
    if (descriptor.scriptSetup) scanScript(descriptor.scriptSetup.content, file, state)
    return
  }
  scanScript(source, file, state)
}

const sourceModule = (root, moduleId) => {
  const withoutQuery = moduleId.replace(/^\0/, '').split('?', 1)[0]
  const absolutePath = isAbsolute(withoutQuery) ? withoutQuery : resolve(root, withoutQuery)
  const file = normalizePath(relative(root, absolutePath))
  const extension = file.slice(file.lastIndexOf('.'))
  if (!SOURCE_EXTENSIONS.has(extension) || !existsSync(absolutePath)) return undefined
  return { absolutePath, file }
}

export const APPROVED_PRODUCT_ICON_BINDINGS = [
  {
    file: 'src/components/InputPassword/src/InputPassword.vue',
    expression: 'getIconName',
    source: 'computed exclusively from ep:view and ep:hide literals'
  },
  {
    file: 'src/layout/components/Breadcrumb/src/Breadcrumb.vue',
    expression: 'meta.icon',
    source: 'productRoutes route metadata'
  },
  {
    file: 'src/layout/components/Menu/src/components/useRenderMenuTitle.tsx',
    expression: 'meta.icon',
    source: 'productRoutes route metadata'
  },
  {
    file: 'src/layout/components/TabMenu/src/TabMenu.vue',
    expression: 'item?.meta?.icon',
    source: 'productRoutes route metadata'
  },
  {
    file: 'src/layout/components/TagsView/src/TagsView.vue',
    expression: 'item?.meta?.icon || item.matched[item.matched.length - 1].meta.icon',
    source: 'visited routes derived from productRoutes'
  },
  {
    file: 'src/layout/components/ContextMenu/src/ContextMenu.vue',
    expression: 'item.icon',
    source: 'fixed TagsView context-menu schemas'
  },
  {
    file: 'src/views/skit/admin/AdminTable.vue',
    expression: 'action.icon',
    source: 'fixed ep:view and ep:edit table actions'
  }
]

export const assertProductIconCoverage = ({
  root = process.cwd(),
  moduleIds,
  manifestPath = 'src/plugins/svgIcon/productIconCollections.ts',
  approvedDynamicBindings = APPROVED_PRODUCT_ICON_BINDINGS
}) => {
  const manifest = readProductIconManifest({ root, manifestPath })
  const state = {
    manifestPrefixes: manifest.prefixes,
    iconNames: new Set(),
    localSvgNames: new Set(),
    dynamicBindings: new Map()
  }

  for (const moduleId of moduleIds) {
    const module = sourceModule(root, moduleId)
    if (module) scanModule(module.absolutePath, module.file, state)
  }

  const missingIcons = sortStrings(
    [...state.iconNames].filter((name) => !manifest.iconNames.has(name))
  )
  if (missingIcons.length > 0) {
    throw new Error(`missing product icons:\n${missingIcons.join('\n')}`)
  }

  const missingLocalSvgs = sortStrings(
    [...state.localSvgNames].filter((name) => {
      const localName = name.slice('svg-icon:'.length)
      return !existsSync(resolve(root, 'src/assets/svgs', `${localName}.svg`))
    })
  )
  if (missingLocalSvgs.length > 0) {
    throw new Error(`missing local SVG:\n${missingLocalSvgs.join('\n')}`)
  }

  const approvedKeys = new Set(
    approvedDynamicBindings.map(
      ({ file, expression }) => `${normalizePath(file)}\0${normalizeExpression(expression)}`
    )
  )
  const unapprovedBindings = [...state.dynamicBindings]
    .filter(([key]) => !approvedKeys.has(key))
    .map(([, binding]) => `${binding.file}: ${binding.expression}`)
    .sort((left, right) => left.localeCompare(right))
  if (unapprovedBindings.length > 0) {
    throw new Error(`unapproved dynamic icon binding:\n${unapprovedBindings.join('\n')}`)
  }

  return {
    iconNames: sortStrings(state.iconNames),
    prefixes: sortStrings(new Set([...state.iconNames].map((name) => name.split(':', 1)[0]))),
    dynamicBindings: [...state.dynamicBindings.values()].sort((left, right) =>
      `${left.file}\0${left.expression}`.localeCompare(`${right.file}\0${right.expression}`)
    ),
    localSvgNames: sortStrings(state.localSvgNames)
  }
}
