[![travis build](https://img.shields.io/travis/com/SimonSiefke/vscode-svg-preview.svg?style=flat-square)](https://travis-ci.com/SimonSiefke/vscode-svg-preview) [![Version](https://vsmarketplacebadge.apphb.com/version/SimonSiefke.svg-preview.svg)](https://marketplace.visualstudio.com/items?itemName=SimonSiefke.svg-preview) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release) [![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)

# Svg Preview for VSCode

![demo](./demo.gif)

<!-- TODO need to figure out why animation is restarted so often -->
<!-- TODO work in html -->
<!-- TODO update content when just opened -->
<!-- TODO handle active text editor before extension is activated -->
<!-- TODO vscode live share -->
<!-- TODO allow custom styles instead of checkerboard pattern -->

## Features

- Live editing of svg files
- Panning of the preview
- Zooming (currently work in progress)
- Ability to automatically open preview (can be enabled via settings)
- Ability to change background of the preview

## Settings

| Property | Description | Default |
| --- | --- | --- |
| svgPreview.autoOpen | Automatically open the preview when an svg file is opened | `false` |
| svgPreview.background | The background of the preview | `"transparent"` |
