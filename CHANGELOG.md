# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Compatibility table in README showing Cypress version support

## [1.5.0] - 2024-12-13
### Added
- Support for Cypress 14.x while maintaining backward compatibility with Cypress 12.x and 13.x
- Updated dependencies to support latest Cypress versions

### Changed
- Updated README with compatibility information

## [1.4.0] - 2024-07-02
### Changed
- Updated package version to 1.4.0
- Updated dependencies and package-lock.json
- Improved documentation regarding publicPath omission

### Fixed
- Issues related to publicPath configuration

## [1.3.3] - 2024-02-05
### Changed
- Updated dependencies

## [1.3.2] - 2024-02-05
### Changed
- Updated custom dev server dependency

## [1.3.1] - 2024-01-12
### Changed
- Updated dependencies

## [1.3.0] - 2024-01-04
### Changed
- Migrated to latest cypress-ct-custom-devserver
- Major internal refactoring for better compatibility

## [1.2.10] - 2024-02-05
### Fixed
- Fixed change condition logic that was causing unnecessary rebuilds

## [1.2.9] - 2024-02-05
### Fixed
- Fixed rebuilds due to false positive spec change events
- Improved file watching logic

## [1.2.8] - 2024-01-16
### Changed
- Minor improvements and bug fixes

## [1.2.3] - 2023-08-08
### Fixed
- Ensured correct CSS sequence loading

## [1.2.2] - 2023-08-07
### Fixed
- Fixed CSS bundle handling

## [1.2.1] - 2023-08-07
### Fixed
- Multiple CSS-related fixes:
  - Fixed context handling
  - Fixed CSS injection mechanism
  - Fixed sequence issues in CSS loading
  - Fixed watchmode toggle functionality
  - Fixed null pointer exceptions
  - Improved CSS handling for run-mode vs build-mode

### Changed
- CSS is no longer written into index.html, uses build mode for run-mode instead
- Improved CSS handling for non-single-bundle configurations

## [1.1.0] - 2023-06-15
### Added
- **New Feature**: `singleBundle` configuration option for bundling tests and dependencies into a single file
- **New Feature**: `singleBundleConfig` option for additional esbuild configuration when using single bundle mode

### Changed
- Updated documentation with new single bundle options

## [1.0.8] - 2023-05-23
### Changed
- Updated dependencies

## [1.0.7] - 2023-05-23
### Added
- **New Feature**: Configurable logging system
- Added `logFunction` parameter for custom log handling

### Changed
- Made logging configurable with different log levels (1-6, where 1 is critical errors and 6 is debug info)

## [1.0.6] - 2023-05-11
### Changed
- Version increment with minor improvements

## [1.0.5] - 2023-05-11
### Changed
- Updated dependencies

## [1.0.4] - 2023-05-11
### Changed
- Updated dependency

## [1.0.3] - 2023-05-10
### Fixed
- Fixed timing issue: now waits for build to finish before starting webserver

## [1.0.2] - 2023-05-04
### Changed
- Updated README documentation

## [1.0.1] - 2023-04-30
### Changed
- Updated dependencies

## [1.0.0] - 2023-04-26
### Added
- **Major Release**: Complete rewrite and stabilization
- Added comprehensive test suite
- Added CircleCI integration for continuous testing
- Added proper .gitignore for build artifacts

### Changed
- **Breaking**: Improved API design and structure
- **Breaking**: Cleaned up and simplified configuration options
- Enhanced documentation with better examples
- Improved error handling and logging

### Fixed
- Fixed outbase handling for Linux compatibility
- Fixed relative path handling in esbuild for CI environments
- Added missing package dependencies

## [0.2.6] - 2023-04-26
### Changed
- Simplified API for easier usage

## [0.1.10] - 2023-04-24
### Fixed
- Made the dev server functional

## [0.1.1] - 2023-04-24
### Added
- Added fallback mechanisms

## [0.1.0] - 2023-04-24
### Added
- Initial package publication
- Basic esbuild dev server functionality
- Package.json configuration

### Changed
- Changed package name for npm publication

## [Initial Development] - 2023-04-24
### Added
- Initial commit with MIT License
- Created README.md with basic documentation
- Set up initial code structure

---

## Version Support Matrix

| cypress-devserver-esbuild Version | Cypress Version | esbuild Version | Notes |
|-----------------------------------|-----------------|-----------------|-------|
| 1.5.x+ | ^12.0.0 - ^14.x.x | ^0.17.0 | Added Cypress 14 support |
| 1.0.x - 1.4.x | ^12.0.0 - ^13.x.x | ^0.17.0 | Stable releases |
| 0.x.x | < 12.0.0 | ^0.17.0 | Pre-release versions |

## Migration Guide

### Upgrading to 1.0.0
- Review your configuration as the API was simplified
- Check that your esbuild configuration is compatible
- Update any custom logging if you were using internal logging mechanisms

### Upgrading to 1.1.0
- No breaking changes
- Consider using the new `singleBundle` option if you experience performance issues with many chunks

### Upgrading to 1.5.0
- No breaking changes
- Now supports Cypress 14.x in addition to previous versions
- All existing configurations remain compatible
