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
const PRODUCT_ICON_CLAMP = 'clampProductIcon'

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
  const normalized = canonicalIconExpression(expression)
  if (!normalized) return
  state.dynamicBindings.set(`${file}\0${normalized}`, { file, expression: normalized })
}

const addUnsafePropSpread = (file, expression, state) => {
  const normalized = normalizeExpression(expression)
  const key = `${file}\0${normalized}`
  state.unsafePropSpreads.set(key, { file, expression: normalized })
}

const addUnsafePropBinding = (file, expression, state) => {
  const normalized = normalizeExpression(expression)
  const key = `${file}\0${normalized}`
  state.unsafePropBindings.set(key, { file, expression: normalized })
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

const canonicalIconExpression = (expression) => {
  const parsed = unwrapExpression(parseIconExpression(expression))
  if (!parsed) return normalizeExpression(expression)
  return ts
    .createPrinter({ removeComments: true })
    .printNode(ts.EmitHint.Expression, parsed, parsed.getSourceFile())
    .trim()
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

const scanTemplateNode = (node, file, state, iconComponentNames) => {
  if (node.type === 1) {
    for (const property of node.props) {
      if (property.type === 7 && property.exp?.type === 4) {
        addIconNames(property.exp.content, state, { knownPrefixesOnly: true })
      }
    }
  }

  if (node.type === 1 && iconComponentNames.has(node.tag)) {
    for (const property of node.props) {
      if (property.type === 7 && property.name === 'bind' && !property.arg) {
        const expression = property.exp?.type === 4 ? property.exp.content : ''
        addUnsafePropSpread(file, `v-bind="${expression}"`, state)
        continue
      }
      if (
        property.type === 7 &&
        property.name === 'bind' &&
        property.arg &&
        !(property.arg.type === 4 && property.arg.isStatic)
      ) {
        addUnsafePropBinding(file, property.loc.source, state)
        continue
      }
      if (property.type === 6 && property.name === 'icon') {
        if (property.value) addIconNames(property.value.content, state)
        continue
      }
      if (
        property.type === 7 &&
        property.name === 'bind' &&
        property.arg?.type === 4 &&
        property.arg.isStatic &&
        property.arg.content === 'icon'
      ) {
        scanIconExpression(
          file,
          property.exp?.type === 4 ? property.exp.content : property.arg.content,
          state
        )
      }
    }
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) scanTemplateNode(child, file, state, iconComponentNames)
  }
  if (Array.isArray(node.branches)) {
    for (const branch of node.branches) {
      scanTemplateNode(branch, file, state, iconComponentNames)
    }
  }
}

const scanScript = (source, file, state, iconComponentNames, scriptKind = ts.ScriptKind.TSX) => {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind)

  const collectIconComponentAliases = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      (node.moduleSpecifier.text === '@/components/Icon' ||
        node.moduleSpecifier.text.startsWith('@/components/Icon/'))
    ) {
      if (node.moduleSpecifier.text !== '@/components/Icon' && node.importClause?.name) {
        iconComponentNames.add(node.importClause.name.text)
      }
      if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
        for (const element of node.importClause.namedBindings.elements) {
          const exportedName = element.propertyName?.text || element.name.text
          if (exportedName === 'Icon') iconComponentNames.add(element.name.text)
        }
      }
    }
    const aliasInitializer = ts.isVariableDeclaration(node)
      ? unwrapExpression(node.initializer)
      : undefined
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      aliasInitializer &&
      ts.isIdentifier(aliasInitializer) &&
      iconComponentNames.has(aliasInitializer.text)
    ) {
      iconComponentNames.add(node.name.text)
    }
    ts.forEachChild(node, collectIconComponentAliases)
  }
  let previousAliasCount = -1
  while (previousAliasCount !== iconComponentNames.size) {
    previousAliasCount = iconComponentNames.size
    collectIconComponentAliases(sourceFile)
  }

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
      if (iconComponentNames.has(node.tagName.getText(sourceFile))) {
        for (const attribute of node.attributes.properties) {
          if (ts.isJsxSpreadAttribute(attribute)) {
            addUnsafePropSpread(file, `{...${attribute.expression.getText(sourceFile)}}`, state)
            continue
          }
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
  const iconComponentNames = new Set(['Icon'])
  if (file.endsWith('.vue')) {
    const { descriptor, errors } = parse(source, { filename: file })
    if (errors.length > 0) {
      throw new Error(`failed to parse ${file}: ${errors.map(String).join('; ')}`)
    }
    if (descriptor.script) scanScript(descriptor.script.content, file, state, iconComponentNames)
    if (descriptor.scriptSetup) {
      scanScript(descriptor.scriptSetup.content, file, state, iconComponentNames)
    }
    if (descriptor.template?.ast) {
      scanTemplateNode(descriptor.template.ast, file, state, iconComponentNames)
    }
    return
  }
  scanScript(source, file, state, iconComponentNames)
}

const sourceModule = (root, moduleId) => {
  const withoutQuery = moduleId.replace(/^\0/, '').split('?', 1)[0]
  const absolutePath = isAbsolute(withoutQuery) ? withoutQuery : resolve(root, withoutQuery)
  const file = normalizePath(relative(root, absolutePath))
  const extension = file.slice(file.lastIndexOf('.'))
  if (!SOURCE_EXTENSIONS.has(extension) || !existsSync(absolutePath)) return undefined
  return { absolutePath, file }
}

const readStaticIconDomain = ({ root, file, exportName }) => {
  const absolutePath = resolve(root, file)
  const source = readFileSync(absolutePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    absolutePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
  const declarations = []
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === exportName
    ) {
      declarations.push(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  if (declarations.length !== 1) {
    throw new Error(
      `product icon domain must have one declaration: ${file}: ${exportName}; received ${declarations.length}`
    )
  }
  const declaration = declarations[0]
  const declarationList = declaration.parent
  const declarationStatement = declarationList?.parent
  const isExportedConst =
    ts.isVariableDeclarationList(declarationList) &&
    (declarationList.flags & ts.NodeFlags.Const) !== 0 &&
    ts.isVariableStatement(declarationStatement) &&
    ts.isSourceFile(declarationStatement.parent) &&
    declarationStatement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
    )
  if (!isExportedConst) {
    throw new Error(`product icon domain must be a top-level export const: ${file}: ${exportName}`)
  }

  const initializer = unwrapExpression(declaration.initializer)
  const frozenArray =
    initializer &&
    ts.isCallExpression(initializer) &&
    ts.isPropertyAccessExpression(initializer.expression) &&
    ts.isIdentifier(initializer.expression.expression) &&
    initializer.expression.expression.text === 'Object' &&
    initializer.expression.name.text === 'freeze' &&
    initializer.arguments.length === 1
      ? unwrapExpression(initializer.arguments[0])
      : undefined
  if (!frozenArray || !ts.isArrayLiteralExpression(frozenArray)) {
    throw new Error(
      `product icon domain must be a static array frozen with Object.freeze: ${file}: ${exportName}`
    )
  }

  const icons = new Set()
  for (const element of frozenArray.elements) {
    const value = unwrapExpression(element)
    if (!value || !ts.isStringLiteralLike(value)) {
      throw new Error(`product icon domain must contain only literals: ${file}: ${exportName}`)
    }
    const [prefix, name, ...extra] = value.text.split(':')
    if (
      extra.length > 0 ||
      !ICON_PREFIX_PATTERN.test(prefix || '') ||
      !ICON_RECORD_NAME_PATTERN.test(name || '')
    ) {
      throw new Error(
        `product icon domain contains an invalid icon: ${file}: ${exportName}: ${value.text}`
      )
    }
    if (icons.has(value.text)) {
      throw new Error(
        `product icon domain contains a duplicate icon: ${file}: ${exportName}: ${value.text}`
      )
    }
    icons.add(value.text)
  }
  if (icons.size === 0) {
    throw new Error(`product icon domain must not be empty: ${file}: ${exportName}`)
  }
  return icons
}

const consumerScriptSource = ({ root, file }) => {
  const absolutePath = resolve(root, file)
  const source = readFileSync(absolutePath, 'utf8')
  if (!file.endsWith('.vue')) return source

  const { descriptor, errors } = parse(source, { filename: file })
  if (errors.length > 0) {
    throw new Error(`failed to parse ${file}: ${errors.map(String).join('; ')}`)
  }
  return [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n')
}

const bindingNames = (name, names = []) => {
  if (!name) return names
  if (ts.isIdentifier(name)) {
    names.push(name.text)
    return names
  }
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const element of name.elements) {
      if (ts.isBindingElement(element)) bindingNames(element.name, names)
    }
  }
  return names
}

const assertConsumerImportsIconPolicy = ({ root, file, domainFile, domainExport }) => {
  const source = consumerScriptSource({ root, file })
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.vue') || file.endsWith('.tsx') || file.endsWith('.jsx')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS
  )
  const expectedModule =
    domainFile.startsWith('src/') && /\.(?:[cm]?[jt]sx?)$/.test(domainFile)
      ? `@/${domainFile.slice('src/'.length).replace(/\.(?:[cm]?[jt]sx?)$/, '')}`
      : undefined
  if (!expectedModule) {
    throw new Error(`product icon domain file has no supported module path: ${domainFile}`)
  }

  const exactImports = new Set()
  const shadowedBindings = new Set()
  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      node.moduleSpecifier.text === expectedModule &&
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings)
    ) {
      for (const element of node.importClause.namedBindings.elements) {
        const exportedName = element.propertyName?.text || element.name.text
        if (element.name.text === exportedName) exactImports.add(exportedName)
      }
    }

    if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) {
      for (const name of bindingNames(node.name)) {
        if (name === PRODUCT_ICON_CLAMP || name === domainExport) shadowedBindings.add(name)
      }
    } else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isClassDeclaration(node) ||
        ts.isClassExpression(node) ||
        ts.isEnumDeclaration(node)) &&
      node.name &&
      (node.name.text === PRODUCT_ICON_CLAMP || node.name.text === domainExport)
    ) {
      shadowedBindings.add(node.name.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  const missingImports = [PRODUCT_ICON_CLAMP, domainExport].filter(
    (name) => !exactImports.has(name)
  )
  if (missingImports.length > 0) {
    throw new Error(
      `approved dynamic icon binding must import ${missingImports.join(', ')} from ${expectedModule}: ${file}`
    )
  }
  if (shadowedBindings.size > 0) {
    throw new Error(
      `approved dynamic icon binding shadows product icon policy: ${file}: ${sortStrings(shadowedBindings).join(', ')}`
    )
  }
}

const assertClampedApprovalExpression = ({ file, expression, domainExport }) => {
  const parsed = unwrapExpression(parseIconExpression(expression))
  const valid =
    parsed &&
    ts.isCallExpression(parsed) &&
    ts.isIdentifier(parsed.expression) &&
    parsed.expression.text === PRODUCT_ICON_CLAMP &&
    parsed.arguments.length === 2 &&
    ts.isIdentifier(unwrapExpression(parsed.arguments[1])) &&
    unwrapExpression(parsed.arguments[1]).text === domainExport
  if (!valid) {
    throw new Error(
      `approved dynamic icon binding must use ${PRODUCT_ICON_CLAMP}: ${file}: ${expression}`
    )
  }
}

const collectProductIconUsageState = ({ root, moduleIds, manifestPrefixes }) => {
  const state = {
    manifestPrefixes,
    iconNames: new Set(),
    localSvgNames: new Set(),
    dynamicBindings: new Map(),
    unsafePropSpreads: new Map(),
    unsafePropBindings: new Map()
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
    expression: 'clampProductIcon(getIconName, INPUT_PASSWORD_ICON_NAMES)',
    source: 'password toggle values are clamped to the named local domain',
    domainFile: 'src/components/Icon/src/productIconDomains.ts',
    domainExport: 'INPUT_PASSWORD_ICON_NAMES'
  },
  {
    file: 'src/layout/components/Breadcrumb/src/Breadcrumb.vue',
    expression: 'clampProductIcon(meta.icon, PRODUCT_ROUTE_ICON_NAMES)',
    source: 'product route metadata is clamped before breadcrumb rendering',
    domainFile: 'src/components/Icon/src/productIconDomains.ts',
    domainExport: 'PRODUCT_ROUTE_ICON_NAMES'
  },
  {
    file: 'src/layout/components/Menu/src/components/useRenderMenuTitle.tsx',
    expression: 'clampProductIcon(meta.icon, PRODUCT_ROUTE_ICON_NAMES)',
    source: 'product route metadata is clamped before menu rendering',
    domainFile: 'src/components/Icon/src/productIconDomains.ts',
    domainExport: 'PRODUCT_ROUTE_ICON_NAMES'
  },
  {
    file: 'src/layout/components/Menu/src/Menu.vue',
    expression: 'clampProductIcon(firstVisibleChild.meta?.icon, PRODUCT_ROUTE_ICON_NAMES)',
    source: 'first visible child metadata is clamped before root-menu projection',
    domainFile: 'src/components/Icon/src/productIconDomains.ts',
    domainExport: 'PRODUCT_ROUTE_ICON_NAMES'
  },
  {
    file: 'src/layout/components/TabMenu/src/TabMenu.vue',
    expression: 'clampProductIcon(item?.meta?.icon, PRODUCT_ROUTE_ICON_NAMES)',
    source: 'product route metadata is clamped before tab-menu rendering',
    domainFile: 'src/components/Icon/src/productIconDomains.ts',
    domainExport: 'PRODUCT_ROUTE_ICON_NAMES'
  },
  {
    file: 'src/layout/components/TagsView/src/TagsView.vue',
    expression:
      'clampProductIcon(item?.meta?.icon || item.matched[item.matched.length - 1].meta.icon, PRODUCT_ROUTE_ICON_NAMES)',
    source: 'visited route metadata is clamped before TagsView rendering',
    domainFile: 'src/components/Icon/src/productIconDomains.ts',
    domainExport: 'PRODUCT_ROUTE_ICON_NAMES'
  },
  {
    file: 'src/layout/components/ContextMenu/src/ContextMenu.vue',
    expression: 'clampProductIcon(item.icon, CONTEXT_MENU_ICON_NAMES)',
    source: 'context-menu schema icons are clamped to the named local domain',
    domainFile: 'src/components/Icon/src/productIconDomains.ts',
    domainExport: 'CONTEXT_MENU_ICON_NAMES'
  },
  {
    file: 'src/views/skit/admin/AdminTable.vue',
    expression: 'clampProductIcon(action.icon, ADMIN_ACTION_ICON_NAMES)',
    source: 'row actions are clamped to the named local domain',
    domainFile: 'src/components/Icon/src/productIconDomains.ts',
    domainExport: 'ADMIN_ACTION_ICON_NAMES'
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

  const normalizedModuleIds = new Set(
    moduleIds
      .map((moduleId) => sourceModule(root, moduleId)?.file)
      .filter(Boolean)
      .map(normalizePath)
  )
  const unsafePropSpreads = [...state.unsafePropSpreads.values()]
    .map(({ file, expression }) => `${file}: ${expression}`)
    .sort((left, right) => left.localeCompare(right))
  if (unsafePropSpreads.length > 0) {
    throw new Error(`unbounded Icon prop spread:\n${unsafePropSpreads.join('\n')}`)
  }
  const unsafePropBindings = [...state.unsafePropBindings.values()]
    .map(({ file, expression }) => `${file}: ${expression}`)
    .sort((left, right) => left.localeCompare(right))
  if (unsafePropBindings.length > 0) {
    throw new Error(`unbounded Icon prop binding:\n${unsafePropBindings.join('\n')}`)
  }

  const approvedKeys = new Set()
  const approvedDomainIcons = new Set()
  const domainCache = new Map()
  for (const approval of approvedDynamicBindings) {
    const file = normalizePath(approval.file)
    const expression = canonicalIconExpression(approval.expression)
    const key = `${file}\0${expression}`
    if (approvedKeys.has(key)) {
      throw new Error(`duplicate approved dynamic icon binding: ${file}: ${expression}`)
    }
    if (typeof approval.source !== 'string' || !approval.source.trim()) {
      throw new Error(
        `approved dynamic icon binding requires source evidence: ${file}: ${expression}`
      )
    }
    assertClampedApprovalExpression({
      file,
      expression,
      domainExport: approval.domainExport
    })
    if (typeof approval.domainFile !== 'string' || !approval.domainFile.trim()) {
      throw new Error(
        `approved dynamic icon binding requires a domain file: ${file}: ${expression}`
      )
    }
    if (typeof approval.domainExport !== 'string' || !approval.domainExport.trim()) {
      throw new Error(
        `approved dynamic icon binding requires a domain export: ${file}: ${expression}`
      )
    }
    const domainFile = normalizePath(approval.domainFile)
    if (!normalizedModuleIds.has(domainFile) || !existsSync(resolve(root, domainFile))) {
      throw new Error(
        `approved dynamic icon binding domain is outside the product graph: ${file}: ${expression} -> ${domainFile}`
      )
    }
    const domainKey = `${domainFile}\0${approval.domainExport}`
    let domainIcons = domainCache.get(domainKey)
    if (!domainIcons) {
      domainIcons = readStaticIconDomain({
        root,
        file: domainFile,
        exportName: approval.domainExport
      })
      domainCache.set(domainKey, domainIcons)
    }
    assertConsumerImportsIconPolicy({
      root,
      file,
      domainFile,
      domainExport: approval.domainExport
    })
    for (const icon of domainIcons) {
      approvedDomainIcons.add(icon)
    }
    approvedKeys.add(key)
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

  const usedIconNames = new Set([...state.iconNames, ...approvedDomainIcons])
  const missingIcons = sortStrings(
    [...usedIconNames].filter((name) => !manifest.iconNames.has(name))
  )
  if (missingIcons.length > 0) {
    throw new Error(`missing product icons:\n${missingIcons.join('\n')}`)
  }

  const requiredManifestIcons = new Set(usedIconNames)
  for (const name of usedIconNames) {
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

  return {
    iconNames: sortStrings(usedIconNames),
    prefixes: sortStrings(new Set([...usedIconNames].map((name) => name.split(':', 1)[0]))),
    dynamicBindings: [...state.dynamicBindings.values()].sort((left, right) =>
      `${left.file}\0${left.expression}`.localeCompare(`${right.file}\0${right.expression}`)
    ),
    localSvgNames: sortStrings(state.localSvgNames)
  }
}
