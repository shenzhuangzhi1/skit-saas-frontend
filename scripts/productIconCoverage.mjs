import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

import ts from 'typescript'
import { parse } from 'vue/compiler-sfc'

const PRODUCT_ICON_VARIABLE = 'productIconCollections'
const ICON_PROPERTY_NAMES = new Set(['icon', 'preIcon'])
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue'])
const ICON_NAME_PATTERN = /\b([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9][a-z0-9_/-]*)\b/gi
const ICON_PREFIX_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ICON_RECORD_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]*(?:\/[a-z0-9][a-z0-9_-]*)*$/

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

const parseProductIconManifest = ({ root, manifestPath }) => {
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
  const directIconNames = new Set()
  const prefixes = new Set()
  const aliasParentByName = new Map()
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
    if (!ICON_PREFIX_PATTERN.test(prefix)) {
      throw new Error(`invalid product icon prefix: ${prefix}`)
    }
    if (prefixes.has(prefix)) {
      throw new Error(`duplicate product icon prefix: ${prefix}`)
    }
    const icons = objectValue(iconsProperty.initializer, `collection ${prefix} icons`)
    prefixes.add(prefix)
    for (const icon of icons.properties) {
      const name = propertyName(icon)
      if (!name) throw new Error(`collection ${prefix} contains an invalid icon property`)
      const fullName = `${prefix}:${name}`
      if (!ICON_RECORD_NAME_PATTERN.test(name)) {
        throw new Error(`invalid product icon name: ${fullName}`)
      }
      if (iconNames.has(fullName)) {
        throw new Error(`duplicate product icon name: ${fullName}`)
      }
      iconNames.add(fullName)
      directIconNames.add(fullName)
    }

    const aliasesProperty = objectProperty(collection, 'aliases')
    if (aliasesProperty && ts.isPropertyAssignment(aliasesProperty)) {
      const aliases = objectValue(aliasesProperty.initializer, `collection ${prefix} aliases`)
      for (const alias of aliases.properties) {
        const name = propertyName(alias)
        if (!name) throw new Error(`collection ${prefix} contains an invalid alias property`)
        const fullName = `${prefix}:${name}`
        if (!ICON_RECORD_NAME_PATTERN.test(name)) {
          throw new Error(`invalid product icon name: ${fullName}`)
        }
        if (iconNames.has(fullName)) {
          throw new Error(`duplicate product icon name: ${fullName}`)
        }
        if (!ts.isPropertyAssignment(alias)) {
          throw new Error(`product icon alias must be a property assignment: ${fullName}`)
        }
        const aliasValue = objectValue(alias.initializer, `product icon alias ${fullName}`)
        const parentProperty = objectProperty(aliasValue, 'parent')
        if (!parentProperty || !ts.isPropertyAssignment(parentProperty)) {
          throw new Error(`product icon alias is missing parent: ${fullName}`)
        }
        const parent = stringValue(
          parentProperty.initializer,
          `product icon alias ${fullName} parent`
        )
        const fullParent = `${prefix}:${parent}`
        iconNames.add(fullName)
        aliasParentByName.set(fullName, fullParent)
      }
    }
  }

  for (const [aliasName, initialParent] of aliasParentByName) {
    const visited = new Set([aliasName])
    let parent = initialParent
    while (!directIconNames.has(parent)) {
      if (visited.has(parent) || !aliasParentByName.has(parent)) {
        throw new Error(`unresolved product icon alias: ${aliasName} -> ${parent}`)
      }
      visited.add(parent)
      parent = aliasParentByName.get(parent)
    }
  }

  return {
    iconNames,
    prefixes,
    directIconNames,
    aliasParentByName
  }
}

export const readProductIconManifest = (options) => {
  const manifest = parseProductIconManifest(options)
  return {
    iconNames: sortStrings(manifest.iconNames),
    prefixes: sortStrings(manifest.prefixes),
    aliasParents: sortStrings(new Set(manifest.aliasParentByName.values()))
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

const parseIconExpression = (expression) => {
  const sourceFile = ts.createSourceFile(
    'product-icon-expression.ts',
    `const __productIcon = (${expression})`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const statement = sourceFile.statements[0]
  if (
    !statement ||
    !ts.isVariableStatement(statement) ||
    statement.declarationList.declarations.length !== 1
  ) {
    return undefined
  }
  return statement.declarationList.declarations[0].initializer
}

const collectStaticIconValueBranches = (node, state) => {
  const value = unwrapExpression(node)
  if (!value) return false

  if (ts.isStringLiteralLike(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    addIconNames(value.text, state)
    return true
  }

  if (ts.isConditionalExpression(value)) {
    const whenTrueIsStatic = collectStaticIconValueBranches(value.whenTrue, state)
    const whenFalseIsStatic = collectStaticIconValueBranches(value.whenFalse, state)
    return whenTrueIsStatic && whenFalseIsStatic
  }

  if (
    ts.isBinaryExpression(value) &&
    (value.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
      value.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
  ) {
    const leftIsStatic = collectStaticIconValueBranches(value.left, state)
    const rightIsStatic = collectStaticIconValueBranches(value.right, state)
    return leftIsStatic && rightIsStatic
  }

  return false
}

const scanIconExpression = (file, expression, state) => {
  const parsed = parseIconExpression(expression)
  if (!parsed || !collectStaticIconValueBranches(parsed, state)) {
    addDynamicBinding(file, expression, state)
  }
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
      const isDefinePropsSchema =
        ts.isObjectLiteralExpression(node.parent) &&
        ts.isCallExpression(node.parent.parent) &&
        ts.isIdentifier(node.parent.parent.expression) &&
        node.parent.parent.expression.text === 'defineProps'
      if (!isDefinePropsSchema) {
        scanIconExpression(file, node.initializer.getText(sourceFile), state)
      }
    }

    if (ts.isShorthandPropertyAssignment(node) && ICON_PROPERTY_NAMES.has(propertyName(node))) {
      scanIconExpression(file, node.name.getText(sourceFile), state)
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

const collectProductIconUsageState = ({ root, moduleIds, manifestPrefixes }) => {
  const state = {
    manifestPrefixes,
    iconNames: new Set(),
    localSvgNames: new Set(),
    dynamicBindings: new Map()
  }

  for (const moduleId of moduleIds) {
    const module = sourceModule(root, moduleId)
    if (module) scanModule(module.absolutePath, module.file, state)
  }
  return state
}

export const collectProductIconUsage = ({
  root = process.cwd(),
  moduleIds,
  manifestPath = 'src/plugins/svgIcon/productIconCollections.ts'
}) => {
  const manifest = parseProductIconManifest({ root, manifestPath })
  const state = collectProductIconUsageState({
    root,
    moduleIds,
    manifestPrefixes: manifest.prefixes
  })
  return {
    iconNames: sortStrings(state.iconNames),
    dynamicBindings: [...state.dynamicBindings.values()].sort((left, right) =>
      `${left.file}\0${left.expression}`.localeCompare(`${right.file}\0${right.expression}`)
    ),
    localSvgNames: sortStrings(state.localSvgNames)
  }
}

export const APPROVED_PRODUCT_ICON_BINDINGS = [
  {
    file: 'src/components/InputPassword/src/InputPassword.vue',
    expression: 'getIconName',
    source: 'computed exclusively from ep:view and ep:hide literals',
    sourceFiles: ['src/components/InputPassword/src/InputPassword.vue']
  },
  {
    file: 'src/layout/components/Breadcrumb/src/Breadcrumb.vue',
    expression: 'meta.icon',
    source: 'productRoutes route metadata',
    sourceFiles: ['src/router/productRoutes.ts']
  },
  {
    file: 'src/layout/components/Menu/src/components/useRenderMenuTitle.tsx',
    expression: 'meta.icon',
    source: 'productRoutes route metadata',
    sourceFiles: ['src/router/productRoutes.ts']
  },
  {
    file: 'src/layout/components/Menu/src/Menu.vue',
    expression: 'firstVisibleChild.meta?.icon',
    source: 'first visible child from productRoutes route metadata',
    sourceFiles: ['src/router/productRoutes.ts']
  },
  {
    file: 'src/layout/components/TabMenu/src/TabMenu.vue',
    expression: 'item?.meta?.icon',
    source: 'productRoutes route metadata',
    sourceFiles: ['src/router/productRoutes.ts']
  },
  {
    file: 'src/layout/components/TagsView/src/TagsView.vue',
    expression: 'item?.meta?.icon || item.matched[item.matched.length - 1].meta.icon',
    source: 'visited routes derived from productRoutes',
    sourceFiles: ['src/router/productRoutes.ts']
  },
  {
    file: 'src/layout/components/ContextMenu/src/ContextMenu.vue',
    expression: 'item.icon',
    source: 'fixed TagsView context-menu schemas',
    sourceFiles: ['src/layout/components/TagsView/src/TagsView.vue']
  },
  {
    file: 'src/views/skit/admin/AdminTable.vue',
    expression: 'action.icon',
    source: 'fixed ep:view and ep:edit table actions',
    sourceFiles: ['src/views/skit/admin/AdminTable.vue']
  }
]

export const assertProductIconCoverage = ({
  root = process.cwd(),
  moduleIds,
  manifestPath = 'src/plugins/svgIcon/productIconCollections.ts',
  approvedDynamicBindings = APPROVED_PRODUCT_ICON_BINDINGS
}) => {
  const manifest = parseProductIconManifest({ root, manifestPath })
  const state = collectProductIconUsageState({
    root,
    moduleIds,
    manifestPrefixes: manifest.prefixes
  })

  const missingIcons = sortStrings(
    [...state.iconNames].filter((name) => !manifest.iconNames.has(name))
  )
  if (missingIcons.length > 0) {
    throw new Error(`missing product icons:\n${missingIcons.join('\n')}`)
  }

  const requiredManifestIcons = new Set(state.iconNames)
  for (const name of state.iconNames) {
    let parent = manifest.aliasParentByName.get(name)
    while (parent) {
      requiredManifestIcons.add(parent)
      parent = manifest.aliasParentByName.get(parent)
    }
  }
  const extraIcons = sortStrings(
    [...manifest.iconNames].filter((name) => !requiredManifestIcons.has(name))
  )
  const requiredPrefixes = new Set([...requiredManifestIcons].map((name) => name.split(':', 1)[0]))
  const extraPrefixes = sortStrings(
    [...manifest.prefixes]
      .filter((prefix) => !requiredPrefixes.has(prefix))
      .map((prefix) => `${prefix}:*`)
  )
  if (extraIcons.length > 0 || extraPrefixes.length > 0) {
    throw new Error(
      `extra product manifest icons:\n${[...extraIcons, ...extraPrefixes].join('\n')}`
    )
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

  const normalizedModuleIds = new Set(
    moduleIds
      .map((moduleId) => sourceModule(root, moduleId)?.file)
      .filter(Boolean)
      .map(normalizePath)
  )
  const approvedKeys = new Set()
  const finiteSourceAudits = []
  for (const approval of approvedDynamicBindings) {
    const file = normalizePath(approval.file)
    const expression = normalizeExpression(approval.expression)
    const key = `${file}\0${expression}`
    if (approvedKeys.has(key)) {
      throw new Error(`duplicate approved dynamic icon binding: ${file}: ${expression}`)
    }
    if (typeof approval.source !== 'string' || !approval.source.trim()) {
      throw new Error(
        `approved dynamic icon binding requires source evidence: ${file}: ${expression}`
      )
    }
    if (!Array.isArray(approval.sourceFiles) || approval.sourceFiles.length === 0) {
      throw new Error(
        `approved dynamic icon binding requires finite source files: ${file}: ${expression}`
      )
    }
    for (const rawSourceFile of approval.sourceFiles) {
      const sourceFile = normalizePath(rawSourceFile)
      if (!normalizedModuleIds.has(sourceFile) || !existsSync(resolve(root, sourceFile))) {
        throw new Error(
          `approved dynamic icon binding source is outside the product graph: ${file}: ${expression} -> ${sourceFile}`
        )
      }
    }
    const sourceState = {
      manifestPrefixes: manifest.prefixes,
      iconNames: new Set(),
      localSvgNames: new Set(),
      dynamicBindings: new Map()
    }
    for (const rawSourceFile of approval.sourceFiles) {
      const sourceFile = normalizePath(rawSourceFile)
      scanModule(resolve(root, sourceFile), sourceFile, sourceState)
    }
    if (sourceState.iconNames.size === 0 && sourceState.localSvgNames.size === 0) {
      throw new Error(
        `approved dynamic icon binding has no finite static icon domain: ${file}: ${expression}`
      )
    }
    finiteSourceAudits.push({ file, expression, sourceState })
    approvedKeys.add(key)
  }
  const unapprovedSourceBindings = finiteSourceAudits.flatMap(({ file, expression, sourceState }) =>
    [...sourceState.dynamicBindings]
      .filter(([key]) => !approvedKeys.has(key))
      .map(([, binding]) => `${file}: ${expression} -> ${binding.file}: ${binding.expression}`)
  )
  if (unapprovedSourceBindings.length > 0) {
    throw new Error(
      `approved icon source contains an unapproved dynamic binding:\n${sortStrings(
        unapprovedSourceBindings
      ).join('\n')}`
    )
  }
  const unapprovedBindings = [...state.dynamicBindings]
    .filter(([key]) => !approvedKeys.has(key))
    .map(([, binding]) => `${binding.file}: ${binding.expression}`)
    .sort((left, right) => left.localeCompare(right))
  if (unapprovedBindings.length > 0) {
    throw new Error(`unapproved dynamic icon binding:\n${unapprovedBindings.join('\n')}`)
  }

  const staleApprovals = [...approvedKeys]
    .filter((key) => !state.dynamicBindings.has(key))
    .map((key) => {
      const [file, expression] = key.split('\0')
      return `${file}: ${expression}`
    })
    .sort((left, right) => left.localeCompare(right))
  if (staleApprovals.length > 0) {
    throw new Error(`stale approved dynamic icon binding:\n${staleApprovals.join('\n')}`)
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
