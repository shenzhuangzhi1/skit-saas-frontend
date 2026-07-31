# Third-party icon notices

The application bundles a 77-icon subset generated from `@iconify/json` version `2.2.470` ([package source](https://www.npmjs.com/package/@iconify/json/v/2.2.470)). Only the paths required by the production module graph are copied into `src/plugins/svgIcon/productIconCollections.ts`; the full Iconify JSON package is not shipped or retained as a project dependency.

## Attribution-required artwork

`emojione-monotone:crescent-moon` and `emojione-monotone:sun` are from Emoji One (Monotone) 2.2.7 by Emoji One / the [EmojiTwo contributors](https://github.com/EmojiTwo/emojitwo). They are licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

Changes from the source artwork: Iconify converted the artwork to SVG icon data; this project selected two icons and embeds their paths with `currentColor`. No semantic artwork changes were made. Attribution does not imply endorsement.

## Bundled collections

| Iconify prefix | Upstream version in the Iconify snapshot | License | Upstream source |
| --- | --- | --- | --- |
| `ant-design` | 4.4.2 | MIT | [Ant Design Icons](https://github.com/ant-design/ant-design-icons) |
| `carbon` | 11.79.0 | Apache-2.0 | [Carbon icons](https://github.com/carbon-design-system/carbon/tree/main/packages/icons) |
| `emojione-monotone` | 2.2.7 | CC-BY-4.0 | [EmojiTwo](https://github.com/EmojiTwo/emojitwo) |
| `ep` | 2.3.2 | MIT | [Element Plus Icons](https://github.com/element-plus/element-plus-icons) |
| `fontisto` | 3.0.4 | MIT | [Fontisto](https://github.com/kenangundogan/fontisto) |
| `icon-park-outline` | 1.4.2 | Apache-2.0 | [IconPark](https://github.com/bytedance/IconPark) |
| `ion` | 8.0.13 | MIT | [Ionicons](https://github.com/ionic-team/ionicons) |
| `mdi` | Not declared in snapshot | Apache-2.0 | [Material Design Icons](https://github.com/Templarian/MaterialDesign) |
| `radix-icons` | 1.3.2 | MIT | [Radix Icons](https://github.com/radix-ui/icons) |
| `vaadin` | 4.3.2 | Apache-2.0 | [Vaadin web components](https://github.com/vaadin/web-components) |
| `zmdi` | Not declared in snapshot | OFL-1.1 | [Material Design Iconic Font](https://github.com/zavoloklom/material-design-iconic-font) |

The SPDX identifiers above come from the collection metadata bundled by the specified Iconify snapshot. The corresponding license texts and terms remain available from each linked upstream project and the [SPDX license list](https://spdx.org/licenses/).
