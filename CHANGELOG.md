# Changelog

## [1.24.1](https://github.com/gravity-ui/charts/compare/v1.24.0...v1.24.1) (2025-11-27)


### Bug Fixes

* area series with the same y values ([#290](https://github.com/gravity-ui/charts/issues/290)) ([e3bc78e](https://github.com/gravity-ui/charts/commit/e3bc78e8b79f07eebd190e3e84c44b912f978fca))
* basic area split ([#286](https://github.com/gravity-ui/charts/issues/286)) ([793fbe7](https://github.com/gravity-ui/charts/commit/793fbe7083c7daa55a3914344857ddfae3f6a168))
* basic bar-x split ([#283](https://github.com/gravity-ui/charts/issues/283)) ([85d94fd](https://github.com/gravity-ui/charts/commit/85d94fd30d3133174a2fc3befa98fb10acc1d258))
* fix the label positioning in the area series ([#287](https://github.com/gravity-ui/charts/issues/287)) ([55e1ff1](https://github.com/gravity-ui/charts/commit/55e1ff1769a8949a9ef954fabd2c0de62cb53bd8))
* fix zoom in case of min/max usage ([#284](https://github.com/gravity-ui/charts/issues/284)) ([f397251](https://github.com/gravity-ui/charts/commit/f3972513ff62c885f6a653a98724e6c4bfc986cb))

## [1.24.0](https://github.com/gravity-ui/charts/compare/v1.23.0...v1.24.0) (2025-11-25)


### Features

* add basic range slider ([#264](https://github.com/gravity-ui/charts/issues/264)) ([ef9ebf2](https://github.com/gravity-ui/charts/commit/ef9ebf2ae810cacb1107ec8c77ae784e56e90556))
* add position to the legend configuration (top and bottom options) ([#263](https://github.com/gravity-ui/charts/issues/263)) ([e421cf5](https://github.com/gravity-ui/charts/commit/e421cf5c38b872c000473918884e6c03b7cf19fe))
* basic funnel chart ([#241](https://github.com/gravity-ui/charts/issues/241)) ([8a65bf0](https://github.com/gravity-ui/charts/commit/8a65bf0199786883b587777416e7cec75a48b44e))


### Bug Fixes

* bar-x percent stacking (linear x-axis) ([#268](https://github.com/gravity-ui/charts/issues/268)) ([d202689](https://github.com/gravity-ui/charts/commit/d2026891ca2b3931bc55fb8d8c6bbd7b5b6865a6))
* ignore `maxPadding` in case of range slider using ([#279](https://github.com/gravity-ui/charts/issues/279)) ([cf0e266](https://github.com/gravity-ui/charts/commit/cf0e2669e6925220f12209696f50aadf66b73707))
* line series dataLabels position ([#281](https://github.com/gravity-ui/charts/issues/281)) ([82245b2](https://github.com/gravity-ui/charts/commit/82245b2986d3f369c27443f7bb58f7532278c5e6))
* only the necessary free space should be reserved for data-labels ([#282](https://github.com/gravity-ui/charts/issues/282)) ([ce40ad8](https://github.com/gravity-ui/charts/commit/ce40ad8853aafcd88e529a416cbac387beed26bf))

## [1.23.0](https://github.com/gravity-ui/charts/compare/v1.22.0...v1.23.0) (2025-11-17)


### Features

* add nullMode for area, bar-x, bar-y, heatmap, line, pie, scatter, waterfall charts ([#243](https://github.com/gravity-ui/charts/issues/243)) ([06547bb](https://github.com/gravity-ui/charts/commit/06547bb1f381c4742cbff3a687d184f00d2baf35))


### Bug Fixes

* fix applyAxisCategoriesOrder ([#265](https://github.com/gravity-ui/charts/issues/265)) ([6ac3cd2](https://github.com/gravity-ui/charts/commit/6ac3cd29cb736e4860c2c9a308b6a42ce5a330e0))
* properly handle zoom configuration for unzoomable charts ([#261](https://github.com/gravity-ui/charts/issues/261)) ([2d85319](https://github.com/gravity-ui/charts/commit/2d853192ac7c858f158008b68a57883c6f32c412))

## [1.22.0](https://github.com/gravity-ui/charts/compare/v1.21.0...v1.22.0) (2025-11-10)


### Features

* add reset zoom button configuration ([#253](https://github.com/gravity-ui/charts/issues/253)) ([b5da66a](https://github.com/gravity-ui/charts/commit/b5da66a46c07d22f43cce59b68991fc7f03e78c9))


### Bug Fixes

* fix text size calculation ([#252](https://github.com/gravity-ui/charts/issues/252)) ([3ad7db0](https://github.com/gravity-ui/charts/commit/3ad7db09989a3bab7d33597753644913bea2fc2f))

## [1.21.0](https://github.com/gravity-ui/charts/compare/v1.20.0...v1.21.0) (2025-11-07)


### Features

* support min/max for category axes ([#244](https://github.com/gravity-ui/charts/issues/244)) ([d7b07ff](https://github.com/gravity-ui/charts/commit/d7b07ff34eb13c47f64446d66f7961ea6904c2dd))


### Bug Fixes

* chart title color ([#249](https://github.com/gravity-ui/charts/issues/249)) ([d519bac](https://github.com/gravity-ui/charts/commit/d519bac649b71caae41da97ed538e8ab4cb6ce81))
* fix incorrect selection of the nearest bar when hovering ([#248](https://github.com/gravity-ui/charts/issues/248)) ([33808d6](https://github.com/gravity-ui/charts/commit/33808d6808a7e45b2d7757b93adf7eeecb1d3327))
* y-axis labels rotation ([#246](https://github.com/gravity-ui/charts/issues/246)) ([0392615](https://github.com/gravity-ui/charts/commit/0392615cf7a8c7ffd4550eb8bf70d27b1e69d8c4))

## [1.20.0](https://github.com/gravity-ui/charts/compare/v1.19.0...v1.20.0) (2025-10-30)


### Features

* **validation:** add validation for duplicate category values in axes ([#229](https://github.com/gravity-ui/charts/issues/229)) ([a4b294b](https://github.com/gravity-ui/charts/commit/a4b294be6230f5b0457db0cee188f94e8ed1e4d8))


### Bug Fixes

* fix chart update with new categories on the x-axis ([#232](https://github.com/gravity-ui/charts/issues/232)) ([5dfcab3](https://github.com/gravity-ui/charts/commit/5dfcab38a406739b62908d1e2e6b3731a024b205))

## [1.19.0](https://github.com/gravity-ui/charts/compare/v1.18.2...v1.19.0) (2025-10-29)


### Features

* add heatmap series type ([#226](https://github.com/gravity-ui/charts/issues/226)) ([f6cd22b](https://github.com/gravity-ui/charts/commit/f6cd22be400c52c4372ec1291a2468cd2a879b14))


### Bug Fixes

* fix y-axis label available space ([#230](https://github.com/gravity-ui/charts/issues/230)) ([b9bdd87](https://github.com/gravity-ui/charts/commit/b9bdd8738086126f1a5ea1269b7c8669044412fb))
* y-axis labels should be displayed considering only the visible series ([#227](https://github.com/gravity-ui/charts/issues/227)) ([4902ed0](https://github.com/gravity-ui/charts/commit/4902ed061fcf131fb656aa2696f5de5d5c341e8b))

## [1.18.2](https://github.com/gravity-ui/charts/compare/v1.18.1...v1.18.2) (2025-10-27)


### Bug Fixes

* labels that don't fit inside bars ([#224](https://github.com/gravity-ui/charts/issues/224)) ([7d2dff3](https://github.com/gravity-ui/charts/commit/7d2dff3cb2f5ce81c30682619fba7866c1a578ae))
* should throw no-data error for empty data in all series ([#222](https://github.com/gravity-ui/charts/issues/222)) ([a8f3471](https://github.com/gravity-ui/charts/commit/a8f347188d771a54890a1390c92bdf5c6777d616))

## [1.18.1](https://github.com/gravity-ui/charts/compare/v1.18.0...v1.18.1) (2025-10-27)


### Bug Fixes

* fix bar-y data labels outside plot boundaries ([#217](https://github.com/gravity-ui/charts/issues/217)) ([9bc4170](https://github.com/gravity-ui/charts/commit/9bc41705908816d479f09df3a5b019dcf355f4c3))
* fix bar-y datetime zoom ([#219](https://github.com/gravity-ui/charts/issues/219)) ([3c76e55](https://github.com/gravity-ui/charts/commit/3c76e5593dc7689d03d31055c700568675be1219))
* labels on the x-axis for percentage stacking bar-y ([#221](https://github.com/gravity-ui/charts/issues/221)) ([3dcfc50](https://github.com/gravity-ui/charts/commit/3dcfc5089a854b186941393b3e570020420ce19b))
* y-axis ticks count and position ([#220](https://github.com/gravity-ui/charts/issues/220)) ([d09eb81](https://github.com/gravity-ui/charts/commit/d09eb8144d244c4b2ec50f01a8f70716b8333dcc))

## [1.18.0](https://github.com/gravity-ui/charts/compare/v1.17.0...v1.18.0) (2025-10-21)


### Features

* add tooltip qa attribute option ([#216](https://github.com/gravity-ui/charts/issues/216)) ([c81ea4a](https://github.com/gravity-ui/charts/commit/c81ea4a50c3cf712bcf1f77e9d5052c1860ec870))


### Bug Fixes

* properly handle null data in bar-y & scatter ([#213](https://github.com/gravity-ui/charts/issues/213)) ([8228fde](https://github.com/gravity-ui/charts/commit/8228fde4879d35fd459f382ab82e0aa8a104cccf))
* tooltip header default date format ([#215](https://github.com/gravity-ui/charts/issues/215)) ([8b7f501](https://github.com/gravity-ui/charts/commit/8b7f5011934ab39c3a1c68612ec79053cb82959c))
* y-axis top label ([#212](https://github.com/gravity-ui/charts/issues/212)) ([fbb5688](https://github.com/gravity-ui/charts/commit/fbb56887164e73f7292fba40d172c0b5dc3fcc57))

## [1.17.0](https://github.com/gravity-ui/charts/compare/v1.16.0...v1.17.0) (2025-10-17)


### Features

* refactoring Y-axis rendering ([#209](https://github.com/gravity-ui/charts/issues/209)) ([368f284](https://github.com/gravity-ui/charts/commit/368f2840974d077edbf6780a7bf9c8fe25b4ccdf))


### Bug Fixes

* tooltip headerFormat ([#210](https://github.com/gravity-ui/charts/issues/210)) ([849bde2](https://github.com/gravity-ui/charts/commit/849bde27ddba1d0306267bfb8fb65ef3306ca1cd))

## [1.16.0](https://github.com/gravity-ui/charts/compare/v1.15.0...v1.16.0) (2025-10-16)


### Features

* improve overflowed tooltip rows view ([#205](https://github.com/gravity-ui/charts/issues/205)) ([1d4d21a](https://github.com/gravity-ui/charts/commit/1d4d21ad064a3d0eb98e221144e3174c9b884b42))
* series tooltip formatting ([#204](https://github.com/gravity-ui/charts/issues/204)) ([5b9e51f](https://github.com/gravity-ui/charts/commit/5b9e51fad2e9cacde061306c00273c2758dc7478))


### Bug Fixes

* fix datetime formatting in ru locale ([#202](https://github.com/gravity-ui/charts/issues/202)) ([58c02ea](https://github.com/gravity-ui/charts/commit/58c02eaa50d273372aa3b3e444f0754de92b7183))

## [1.15.0](https://github.com/gravity-ui/charts/compare/v1.14.0...v1.15.0) (2025-10-14)


### Features

* tooltip rowRenderer option ([#199](https://github.com/gravity-ui/charts/issues/199)) ([57fabec](https://github.com/gravity-ui/charts/commit/57fabecd2981e597c4f894f8fbe39b5884329db9))


### Bug Fixes

* calculate x-axis nicing for dense charts with many points ([#201](https://github.com/gravity-ui/charts/issues/201)) ([82c3e1c](https://github.com/gravity-ui/charts/commit/82c3e1cc16c46544a5b7dbae10b73b4e43d05d84))

## [1.14.0](https://github.com/gravity-ui/charts/compare/v1.13.2...v1.14.0) (2025-10-13)


### Features

* support html in categories axes labels ([#197](https://github.com/gravity-ui/charts/issues/197)) ([d6bf869](https://github.com/gravity-ui/charts/commit/d6bf8695207e333366cc0e57aa0d1418c4095a7b))

## [1.13.2](https://github.com/gravity-ui/charts/compare/v1.13.1...v1.13.2) (2025-10-10)


### Bug Fixes

* bar-y bar size with reverse order on Y-axis ([#192](https://github.com/gravity-ui/charts/issues/192)) ([5162b02](https://github.com/gravity-ui/charts/commit/5162b0205b43752ed930cfc00188e497ca0043df))
* border should be ignored for dense bars in bar-y series ([#195](https://github.com/gravity-ui/charts/issues/195)) ([93fb95c](https://github.com/gravity-ui/charts/commit/93fb95ca443d2c54ab1ad791958ca94a860a8cdb))

## [1.13.1](https://github.com/gravity-ui/charts/compare/v1.13.0...v1.13.1) (2025-10-10)


### Bug Fixes

* bar-y and bar-x stack gap ([#190](https://github.com/gravity-ui/charts/issues/190)) ([d1fdd59](https://github.com/gravity-ui/charts/commit/d1fdd596916f959584f64e74792f057a88e9dd42))

## [1.13.0](https://github.com/gravity-ui/charts/compare/v1.12.0...v1.13.0) (2025-10-09)


### Features

* axis order ([#184](https://github.com/gravity-ui/charts/issues/184)) ([244116c](https://github.com/gravity-ui/charts/commit/244116cb5eef184367f9e68f28a2d7bd59bf2a9f))
* bar-y series border color and width ([#185](https://github.com/gravity-ui/charts/issues/185)) ([9803347](https://github.com/gravity-ui/charts/commit/98033477f79761309f168d35ab76db5833f36b38))
* plot lines and bands label ([#182](https://github.com/gravity-ui/charts/issues/182)) ([ed4f9ee](https://github.com/gravity-ui/charts/commit/ed4f9ee1cc4e383445a65e2dee011eeaeaf25d05))


### Bug Fixes

* bar-x, bar-y zero values ([#189](https://github.com/gravity-ui/charts/issues/189)) ([a25d872](https://github.com/gravity-ui/charts/commit/a25d8722d3e1d71f05fbffb79480c34c07d77706))
* bar-y item color in tooltip ([#187](https://github.com/gravity-ui/charts/issues/187)) ([bbee417](https://github.com/gravity-ui/charts/commit/bbee41733b6c0ad9759081e1103ee63546cae3bb))
* bar-y overlapping dataLabels ([#188](https://github.com/gravity-ui/charts/issues/188)) ([bdbad5a](https://github.com/gravity-ui/charts/commit/bdbad5a464e6728fd753772c18b4133939e9306d))
* display all items in a tooltip for grouped bar-y series ([#186](https://github.com/gravity-ui/charts/issues/186)) ([bcadf58](https://github.com/gravity-ui/charts/commit/bcadf5802b9f674b6badbe0516b0e804cc7e0b8c))

## [1.12.0](https://github.com/gravity-ui/charts/compare/v1.11.4...v1.12.0) (2025-10-06)


### Features

* add `tooltip.totals` option ([#179](https://github.com/gravity-ui/charts/issues/179)) ([ff03089](https://github.com/gravity-ui/charts/commit/ff030898fca78513431c18ac049626a401b1f465))


### Bug Fixes

* fix bar-y chart layout ([#181](https://github.com/gravity-ui/charts/issues/181)) ([3545fcb](https://github.com/gravity-ui/charts/commit/3545fcbeb1f4b20e6cf7a51d4615eea1f73ca811))

## [1.11.4](https://github.com/gravity-ui/charts/compare/v1.11.3...v1.11.4) (2025-10-01)


### Bug Fixes

* legend item click should set series visibility ([#178](https://github.com/gravity-ui/charts/issues/178)) ([9a89c04](https://github.com/gravity-ui/charts/commit/9a89c0418b413939b639b9bfdcdebcc7909a92a3))
* legend position ([#176](https://github.com/gravity-ui/charts/issues/176)) ([fee8430](https://github.com/gravity-ui/charts/commit/fee8430ebd3dd995e502930f5a2e68e72fc858ac))

## [1.11.3](https://github.com/gravity-ui/charts/compare/v1.11.2...v1.11.3) (2025-10-01)


### Bug Fixes

* fix last y-axis label position ([#173](https://github.com/gravity-ui/charts/issues/173)) ([1e614cb](https://github.com/gravity-ui/charts/commit/1e614cb220ab56c2467e2cd8761c150957ebb5c1))
* the legend is displayed with the old version of the config when updating the props ([#175](https://github.com/gravity-ui/charts/issues/175)) ([af1d79d](https://github.com/gravity-ui/charts/commit/af1d79d8f498623fedad11d299eb21ad2f36b283))

## [1.11.2](https://github.com/gravity-ui/charts/compare/v1.11.1...v1.11.2) (2025-09-29)


### Bug Fixes

* formatting settings for axis labels ([#172](https://github.com/gravity-ui/charts/issues/172)) ([91eb0ea](https://github.com/gravity-ui/charts/commit/91eb0ea9866d86e8461e14f5b8753a4a80a9090d))
* waterfall tooltip total value ([#171](https://github.com/gravity-ui/charts/issues/171)) ([3a00a4b](https://github.com/gravity-ui/charts/commit/3a00a4b9f931c4ab133a2591c16498a2ddd8e221))
* zoom fixes for area & line charts ([#168](https://github.com/gravity-ui/charts/issues/168)) ([1ae4c3a](https://github.com/gravity-ui/charts/commit/1ae4c3af22dc03ac45b87724a34f7465992fe5ab))

## [1.11.1](https://github.com/gravity-ui/charts/compare/v1.11.0...v1.11.1) (2025-09-19)


### Bug Fixes

* custom font issues ([#164](https://github.com/gravity-ui/charts/issues/164)) ([9672214](https://github.com/gravity-ui/charts/commit/9672214cd51bc0403e658d49ab48be3d8f05a481))

## [1.11.0](https://github.com/gravity-ui/charts/compare/v1.10.2...v1.11.0) (2025-09-19)


### Features

* add `max` property to x-axis & y-axis ([#157](https://github.com/gravity-ui/charts/issues/157)) ([1093042](https://github.com/gravity-ui/charts/commit/10930421349a2368a11ee9ad24753daaa2d5767b))


### Bug Fixes

* axis bottom generator for one tick label ([#162](https://github.com/gravity-ui/charts/issues/162)) ([559dac8](https://github.com/gravity-ui/charts/commit/559dac8310c0ce5a5b248cc7c4de3d9d2b5a97c3))

## [1.10.2](https://github.com/gravity-ui/charts/compare/v1.10.1...v1.10.2) (2025-09-19)


### Bug Fixes

* the legend axis (gradient) is re-added for custom fonts ([#158](https://github.com/gravity-ui/charts/issues/158)) ([9043094](https://github.com/gravity-ui/charts/commit/9043094faae6573d1863e21b20b108da22726736))

## [1.10.1](https://github.com/gravity-ui/charts/compare/v1.10.0...v1.10.1) (2025-09-18)


### Bug Fixes

* correct text calculations for a custom font ([#154](https://github.com/gravity-ui/charts/issues/154)) ([ef0a283](https://github.com/gravity-ui/charts/commit/ef0a2833a246ae40b052883680d80e62c6ce5abd))

## [1.10.0](https://github.com/gravity-ui/charts/compare/v1.9.0...v1.10.0) (2025-09-18)


### Features

* add basic zoom feature ([#145](https://github.com/gravity-ui/charts/issues/145)) ([2cf2010](https://github.com/gravity-ui/charts/commit/2cf20103833ef6d8c38516863ea08c11417ab847))


### Bug Fixes

* add waiting time for font loading when calculating text size ([#151](https://github.com/gravity-ui/charts/issues/151)) ([a73471a](https://github.com/gravity-ui/charts/commit/a73471a3e16e2f06c428baf4d99095c8371c03df))
* scatter marker color ([#152](https://github.com/gravity-ui/charts/issues/152)) ([a047bc7](https://github.com/gravity-ui/charts/commit/a047bc7cf7244bfc8b30078428b89e8eb630aceb))

## [1.9.0](https://github.com/gravity-ui/charts/compare/v1.8.0...v1.9.0) (2025-09-08)


### Features

* add crosshair ([#144](https://github.com/gravity-ui/charts/issues/144)) ([e3a93db](https://github.com/gravity-ui/charts/commit/e3a93dbd6c6cc8143057681505a4a2945cb00361))


### Bug Fixes

* properly handle overflowed legend items ([#147](https://github.com/gravity-ui/charts/issues/147)) ([f2f941a](https://github.com/gravity-ui/charts/commit/f2f941af89a56c1197e99c70d5e6e0455e58de1c))

## [1.8.0](https://github.com/gravity-ui/charts/compare/v1.7.1...v1.8.0) (2025-08-29)


### Features

* add `legend.html` option ([#141](https://github.com/gravity-ui/charts/issues/141)) ([4abb18a](https://github.com/gravity-ui/charts/commit/4abb18a0654352f91649a58b593d3728534e584e))

## [1.7.1](https://github.com/gravity-ui/charts/compare/v1.7.0...v1.7.1) (2025-08-27)


### Bug Fixes

* fix getTextWithElipsis ([#139](https://github.com/gravity-ui/charts/issues/139)) ([cfa2a73](https://github.com/gravity-ui/charts/commit/cfa2a735b7140bf6432759fc1729389bad38192a))

## [1.7.0](https://github.com/gravity-ui/charts/compare/v1.6.7...v1.7.0) (2025-08-26)


### Features

* settings to use your own set of colors ([#138](https://github.com/gravity-ui/charts/issues/138)) ([0160417](https://github.com/gravity-ui/charts/commit/0160417cee2d566c971bba2da6b3789a380b5c23))


### Bug Fixes

* **Pie:** performance of the label rendering ([#137](https://github.com/gravity-ui/charts/issues/137)) ([a20d2b2](https://github.com/gravity-ui/charts/commit/a20d2b28f9cea0c61f9cbf38c6eb5128098ac74f))
* **Treemap:** labels take up less space than they could ([#135](https://github.com/gravity-ui/charts/issues/135)) ([73a4c7c](https://github.com/gravity-ui/charts/commit/73a4c7c072f7fe67f383b680e75d31fb12bd2857))

## [1.6.7](https://github.com/gravity-ui/charts/compare/v1.6.6...v1.6.7) (2025-08-25)


### Bug Fixes

* **Pie:** pieCenterText ([#133](https://github.com/gravity-ui/charts/issues/133)) ([8e962d4](https://github.com/gravity-ui/charts/commit/8e962d478519ad08db69cba6e036112d5c51b51c))

## [1.6.6](https://github.com/gravity-ui/charts/compare/v1.6.5...v1.6.6) (2025-08-25)


### Bug Fixes

* **Treemap:** processing overflowing treemap labels ([#129](https://github.com/gravity-ui/charts/issues/129)) ([1bf3205](https://github.com/gravity-ui/charts/commit/1bf3205e744ae63244a008f5679d40c129284faf))

## [1.6.5](https://github.com/gravity-ui/charts/compare/v1.6.4...v1.6.5) (2025-08-25)


### Bug Fixes

* **Pie:** fix pieCenterText ([#130](https://github.com/gravity-ui/charts/issues/130)) ([fd779ca](https://github.com/gravity-ui/charts/commit/fd779ca409a6dccae064aec4cbd3fe4e5bc5cd8d))

## [1.6.4](https://github.com/gravity-ui/charts/compare/v1.6.3...v1.6.4) (2025-08-21)


### Bug Fixes

* chart layout ([#127](https://github.com/gravity-ui/charts/issues/127)) ([ed093b4](https://github.com/gravity-ui/charts/commit/ed093b4987230f3ca35263232d53bbfe50ca9c42))

## [1.6.3](https://github.com/gravity-ui/charts/compare/v1.6.2...v1.6.3) (2025-08-21)


### Bug Fixes

* chart sizes are calculated incorrectly if the scale is set for t… ([#123](https://github.com/gravity-ui/charts/issues/123)) ([f5236f7](https://github.com/gravity-ui/charts/commit/f5236f7fb0345f12f10bf7d004961f6d0876328f))

## [1.6.2](https://github.com/gravity-ui/charts/compare/v1.6.1...v1.6.2) (2025-08-21)


### Bug Fixes

* html labels position (chart with margin) ([#121](https://github.com/gravity-ui/charts/issues/121)) ([55bb9e0](https://github.com/gravity-ui/charts/commit/55bb9e068393db98691cb36549900e4ab360302d))

## [1.6.1](https://github.com/gravity-ui/charts/compare/v1.6.0...v1.6.1) (2025-08-21)


### Bug Fixes

* pie html dataLabels (color, textOverflow, etc) ([#119](https://github.com/gravity-ui/charts/issues/119)) ([4d60e93](https://github.com/gravity-ui/charts/commit/4d60e93eb81b4e75b2f4e941e160a9d80e943abe))

## [1.6.0](https://github.com/gravity-ui/charts/compare/v1.5.1...v1.6.0) (2025-08-19)


### Features

* **Pie:** add minRadius option ([#115](https://github.com/gravity-ui/charts/issues/115)) ([f554efd](https://github.com/gravity-ui/charts/commit/f554efd38e8fb4eb5e9a37877c53454b5ca2b742))


### Bug Fixes

* **Pie:** fix html labels overflow ([#112](https://github.com/gravity-ui/charts/issues/112)) ([bd41383](https://github.com/gravity-ui/charts/commit/bd4138339aa9cfe53dc60448f56701dd03da1cf6))
* **Pie:** positioning of html labels ([#118](https://github.com/gravity-ui/charts/issues/118)) ([bb563ad](https://github.com/gravity-ui/charts/commit/bb563ad6a819df9a69b8b81676b70d0aa773c83d))
* treemap labels are being cut off even though there is enough space ([#116](https://github.com/gravity-ui/charts/issues/116)) ([aa13e17](https://github.com/gravity-ui/charts/commit/aa13e17c96c91a9a5d6d3e92135047123c2be2f4))

## [1.5.1](https://github.com/gravity-ui/charts/compare/v1.5.0...v1.5.1) (2025-08-14)


### Bug Fixes

* **Pie:** fix possible chart intersection by connectors ([#109](https://github.com/gravity-ui/charts/issues/109)) ([fcecf02](https://github.com/gravity-ui/charts/commit/fcecf02fa5945b686b7c7488ca81837493ac87c2))
* **Treemap:** labels go beyond the boundaries of the chart ([#111](https://github.com/gravity-ui/charts/issues/111)) ([b416104](https://github.com/gravity-ui/charts/commit/b4161047688c8a0a931191cf86558b7999723c21))

## [1.5.0](https://github.com/gravity-ui/charts/compare/v1.4.0...v1.5.0) (2025-08-11)


### Features

* treemap sorting settings ([#107](https://github.com/gravity-ui/charts/issues/107)) ([1b9a4f8](https://github.com/gravity-ui/charts/commit/1b9a4f8df1958cf5ea6a6ab32653ec54dfd6ee46))


### Bug Fixes

* pie dataLabels collapse into three dots (with enough space) ([#105](https://github.com/gravity-ui/charts/issues/105)) ([819828d](https://github.com/gravity-ui/charts/commit/819828d879147651df68ec3d5537a52dc06f36f1))

## [1.4.0](https://github.com/gravity-ui/charts/compare/v1.3.1...v1.4.0) (2025-08-06)


### Features

* **tooltip:** add bg to active lines in default tooltip ([#99](https://github.com/gravity-ui/charts/issues/99)) ([1f6b691](https://github.com/gravity-ui/charts/commit/1f6b691257ef89c1da374cce133a85db26aebe9a))


### Bug Fixes

* tooltip content padding ([#104](https://github.com/gravity-ui/charts/issues/104)) ([73aabff](https://github.com/gravity-ui/charts/commit/73aabff01fbbabfb3fad53534ad4bc90e0355582))

## [1.3.1](https://github.com/gravity-ui/charts/compare/v1.3.0...v1.3.1) (2025-08-04)


### Bug Fixes

* **Pie:** include label width when calculating radius ([#101](https://github.com/gravity-ui/charts/issues/101)) ([6b937ee](https://github.com/gravity-ui/charts/commit/6b937ee77a6723d909c8e87f3559b01dc1e11cb5))

## [1.3.0](https://github.com/gravity-ui/charts/compare/v1.2.0...v1.3.0) (2025-07-31)


### Features

* legend justifyContent option ([#98](https://github.com/gravity-ui/charts/issues/98)) ([7e48f9a](https://github.com/gravity-ui/charts/commit/7e48f9a129ca30954ce1f9d4719506098317e518))


### Bug Fixes

* fix pie chart horizontal cropping in case of limited container width ([#95](https://github.com/gravity-ui/charts/issues/95)) ([a9742c3](https://github.com/gravity-ui/charts/commit/a9742c377035e02ec14c9c8dc7ea956182f322dc))
* labels go beyond the boundaries of the areas on the treemap ([#97](https://github.com/gravity-ui/charts/issues/97)) ([5f7feda](https://github.com/gravity-ui/charts/commit/5f7fedab5c00a59d6b45b1f495b4ecde377db209))
* remove the extra space on the left in the series without axes ([#93](https://github.com/gravity-ui/charts/issues/93)) ([e641e9b](https://github.com/gravity-ui/charts/commit/e641e9b5cc764f634cdb663776e844c6b6c6e7cf))

## [1.2.0](https://github.com/gravity-ui/charts/compare/v1.1.0...v1.2.0) (2025-07-29)


### Features

* add plot bands ([#85](https://github.com/gravity-ui/charts/issues/85)) ([4be9835](https://github.com/gravity-ui/charts/commit/4be98354cfda55efcd921c0af5a594e92112b4cb))


### Bug Fixes

* chart position ([#92](https://github.com/gravity-ui/charts/issues/92)) ([b16654c](https://github.com/gravity-ui/charts/commit/b16654c4c8c5bd16008e7593e06f10200a449b6d))
* should use style options for html labels ([#91](https://github.com/gravity-ui/charts/issues/91)) ([979e619](https://github.com/gravity-ui/charts/commit/979e61920edfeb60aae0e4876b967696c3275b3a))
* special symbols in dataLabels, title and legend ([#90](https://github.com/gravity-ui/charts/issues/90)) ([c477eec](https://github.com/gravity-ui/charts/commit/c477eecea3c2bff90cbd13b2e48f7c59a95c62a0))

## [1.1.0](https://github.com/gravity-ui/charts/compare/v1.0.1...v1.1.0) (2025-07-24)


### Features

* waterfall legend options ([#79](https://github.com/gravity-ui/charts/issues/79)) ([489326a](https://github.com/gravity-ui/charts/commit/489326a6a7697832e17634c5aeac0639586d095b))


### Bug Fixes

* pie center text color ([#80](https://github.com/gravity-ui/charts/issues/80)) ([37f5480](https://github.com/gravity-ui/charts/commit/37f548053017d276d004b6fafcda0244b777dfa1))
* tooltip closest data for line series ([#77](https://github.com/gravity-ui/charts/issues/77)) ([3321456](https://github.com/gravity-ui/charts/commit/33214568f0690a0ec9ec4d83a4ded243e967ac77))
* tooltip value format ([#84](https://github.com/gravity-ui/charts/issues/84)) ([385605a](https://github.com/gravity-ui/charts/commit/385605aebb25cc9496970c92a176f2827b339bac))

## [1.0.1](https://github.com/gravity-ui/charts/compare/v1.0.0...v1.0.1) (2025-05-28)

* The library has been stabilized and is fully compatible with the latest `0.x` release

## [0.11.1](https://github.com/gravity-ui/charts/compare/v0.11.0...v0.11.1) (2025-05-15)


### Bug Fixes

* ignore nulls for bar-y series ([#65](https://github.com/gravity-ui/charts/issues/65)) ([fdbcc3c](https://github.com/gravity-ui/charts/commit/fdbcc3c7a73ea35cb1f4c27d905ac1bc682afd34))

## [0.11.0](https://github.com/gravity-ui/charts/compare/v0.10.0...v0.11.0) (2025-05-12)


### Features

* add dataLabels format options ([#62](https://github.com/gravity-ui/charts/issues/62)) ([4fd8078](https://github.com/gravity-ui/charts/commit/4fd8078544be594b81d3672493e8494834945e11))
* tooltip value format settings ([#64](https://github.com/gravity-ui/charts/issues/64)) ([45096da](https://github.com/gravity-ui/charts/commit/45096da82dd30dea8537767fa30e7c026cd0f545))

## [0.10.0](https://github.com/gravity-ui/charts/compare/v0.9.0...v0.10.0) (2025-05-07)


### Features

* add radar series ([#59](https://github.com/gravity-ui/charts/issues/59)) ([b894714](https://github.com/gravity-ui/charts/commit/b894714497d6e7a2b4a1a913947a8ce8ec17f3ab))

## [0.9.0](https://github.com/gravity-ui/charts/compare/v0.8.0...v0.9.0) (2025-04-29)


### Features

* add tooltip throttle option ([#52](https://github.com/gravity-ui/charts/issues/52)) ([96d3ca4](https://github.com/gravity-ui/charts/commit/96d3ca439b2bc6f0f2b86884061b62cc20ee7400))
* x-axis plot lines options ([#58](https://github.com/gravity-ui/charts/issues/58)) ([168d5ea](https://github.com/gravity-ui/charts/commit/168d5ea9395b0f39c032611c285dc8f4a256f3a5))


### Bug Fixes

* add all types export ([#49](https://github.com/gravity-ui/charts/issues/49)) ([7d1f711](https://github.com/gravity-ui/charts/commit/7d1f7117320483a932946623d6c97475f78a0af0))
* second y axis position ([#57](https://github.com/gravity-ui/charts/issues/57)) ([0113eb0](https://github.com/gravity-ui/charts/commit/0113eb0e622aa69ad85e7233fe130b2073de6fc8))

## [0.8.0](https://github.com/gravity-ui/charts/compare/v0.7.0...v0.8.0) (2025-03-21)


### Features

* add borderRadius option to bar-x series ([#44](https://github.com/gravity-ui/charts/issues/44)) ([c602e65](https://github.com/gravity-ui/charts/commit/c602e657c095085136a25877facf36338bf8b343))
* add borderRadius option to bar-y series ([#47](https://github.com/gravity-ui/charts/issues/47)) ([f4ac52d](https://github.com/gravity-ui/charts/commit/f4ac52d813b11c85085b05d232c51bb025ddb6b7))
* add sankey series type ([#46](https://github.com/gravity-ui/charts/issues/46)) ([8791f30](https://github.com/gravity-ui/charts/commit/8791f30e7eecf6130b70705bc37114b61285748e))
* segment radius for pie series ([#41](https://github.com/gravity-ui/charts/issues/41)) ([b9cf354](https://github.com/gravity-ui/charts/commit/b9cf3543e9d284978fcddaaf041815e1917c9297))
* yAxis plotLines ([#45](https://github.com/gravity-ui/charts/issues/45)) ([6aea3bc](https://github.com/gravity-ui/charts/commit/6aea3bcf86facdd4a019a7e612d7ac7e27006c35))


### Bug Fixes

* circular dependency in useSeries ([#42](https://github.com/gravity-ui/charts/issues/42)) ([caa6a97](https://github.com/gravity-ui/charts/commit/caa6a9791013428d3cb215f5558373b01e88f3f3))
* plot title color ([#39](https://github.com/gravity-ui/charts/issues/39)) ([cd2325d](https://github.com/gravity-ui/charts/commit/cd2325dacdc8418a1bb8b9d8a0ece2791e2d4c21))

## [0.7.0](https://github.com/gravity-ui/charts/compare/v0.6.1...v0.7.0) (2025-02-18)


### ⚠ BREAKING CHANGES

* update to uikit 7 ([#37](https://github.com/gravity-ui/charts/issues/37)) ([4548824](https://github.com/gravity-ui/charts/commit/45488248a74621020daa157ab2c1c9eadafee4be))

## [0.6.1](https://github.com/gravity-ui/charts/compare/v0.6.0...v0.6.1) (2025-01-09)


### Bug Fixes

* improve tooltip style ([#21](https://github.com/gravity-ui/charts/issues/21)) ([c9667fc](https://github.com/gravity-ui/charts/commit/c9667fcb2191888cefbe9e28959244bfe3f5ffde))
* make labels take up less pie chart space ([#23](https://github.com/gravity-ui/charts/issues/23)) ([9bc7756](https://github.com/gravity-ui/charts/commit/9bc77560659acb29f7b10df116653966e0559560))

## [0.6.0](https://github.com/gravity-ui/charts/compare/v0.5.0...v0.6.0) (2024-12-11)


### Features

* support pinnable tooltip ([#19](https://github.com/gravity-ui/charts/issues/19)) ([ca0e324](https://github.com/gravity-ui/charts/commit/ca0e32414b69bdbcd2074e8a89093e9870e8b42f))

## [0.5.0](https://github.com/gravity-ui/charts/compare/v0.4.1...v0.5.0) (2024-12-05)


### Features

* add legend title alignment option ([#17](https://github.com/gravity-ui/charts/issues/17)) ([5d47b17](https://github.com/gravity-ui/charts/commit/5d47b170b42868cbd9ca40ae4e5aea7522ea3cfd))

## [0.4.1](https://github.com/gravity-ui/charts/compare/v0.4.0...v0.4.1) (2024-12-02)


### Bug Fixes

* **chart-error:** return backward compability with chartkit ([#15](https://github.com/gravity-ui/charts/issues/15)) ([7716851](https://github.com/gravity-ui/charts/commit/7716851ecc5f0622325b72f64cba903a31465ca6))

## [0.4.0](https://github.com/gravity-ui/charts/compare/v0.3.0...v0.4.0) (2024-11-14)


### Features

* add `ChartTooltipContent` & change chart.events.pointermove signature ([#13](https://github.com/gravity-ui/charts/issues/13)) ([5aed61d](https://github.com/gravity-ui/charts/commit/5aed61dd2e11692fff48d564d009e9a19710f6d8))
* support moving touch events ([#11](https://github.com/gravity-ui/charts/issues/11)) ([b898f4e](https://github.com/gravity-ui/charts/commit/b898f4edbababad5b3b75da44d083533a5d9081d))

## [0.3.0](https://github.com/gravity-ui/charts/compare/v0.2.0...v0.3.0) (2024-11-12)


### Features

* add chart.events.pointermove property ([#9](https://github.com/gravity-ui/charts/issues/9)) ([6e2822a](https://github.com/gravity-ui/charts/commit/6e2822ab49fd3650e91da81aaa69e375b62874ac))

## [0.2.0](https://github.com/gravity-ui/charts/compare/v0.1.1...v0.2.0) (2024-11-11)


### Features

* add CustomShapeRenderer export ([#7](https://github.com/gravity-ui/charts/issues/7)) ([2d7e009](https://github.com/gravity-ui/charts/commit/2d7e0097126814bb7de3a03ba2617fb5fdf443c7))

## [0.1.1](https://github.com/gravity-ui/charts/compare/v1.0.0...v1.0.1) (2024-11-11)


### Bug Fixes

* add i18n keysets data to build ([#5](https://github.com/gravity-ui/charts/issues/5)) ([39a2f0e](https://github.com/gravity-ui/charts/commit/39a2f0ebd97e15041b7b00f01022be125987e9ec))

## 0.1.0 (2024-11-08)


### Features

* move library core from @gravity-ui/chartkit ([#2](https://github.com/gravity-ui/charts/issues/2)) ([c66b964](https://github.com/gravity-ui/charts/commit/c66b96436ab811fc0e05a6aecec06da75cfdf7fd))
