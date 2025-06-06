# Privacy Policy for No Nonsense Notes for SAP

**Effective Date:** 2025-06-06

## Overview

No Nonsense Notes for SAP is a Chrome extension that provides fast access to SAP Notes and Knowledge Base Articles. This privacy policy explains how the extension handles your data and protects your privacy.

## Data Collection and Usage

### Information We Access

The extension requires access to:
- **SAP Session Data**: Your existing SAP authentication cookies from `https://me.sap.com/*` to fetch note content
- **SAP Note Content**: Technical documentation and knowledge base articles from SAP's servers
- **User Input**: SAP Note IDs you enter through the browser's address bar (omnibox)

### How We Use Your Information

The extension uses your data solely to:
- Authenticate with SAP's backend API to retrieve note content
- Display SAP Notes in a clean, formatted interface
- Navigate between related SAP documentation

### Data We Do NOT Collect

- Personal identification information
- Browsing history outside of SAP Note access
- User credentials or passwords
- Any data stored locally on your device

## External Services

### SAP Integration

The extension communicates with:
- **SAP Backend API**: `https://me.sap.com/backend/raw/sapnotes/Detail` to fetch note content
- **SAP Website Links**: Creates navigation links to related SAP resources

All requests to SAP services use your existing authentication session and are subject to SAP's own privacy policies.

## Data Storage

- **Local Storage**: The extension does not store any personal data locally
- **Session Data**: Relies on your browser's existing SAP session cookies
- **Demo Content**: Contains one demo SAP Note (ID: 42424242) stored within the extension for testing purposes

## Permissions

### Host Permissions
- `https://me.sap.com/*` - Required to fetch SAP Note content from SAP's backend API

### Browser Permissions
- **Omnibox**: Allows you to search for SAP Notes directly from the address bar using the "note" keyword
- **Tabs**: Creates new tabs to display SAP Note content

## Data Security

- All communication with SAP services uses HTTPS encryption
- No sensitive data is stored or transmitted outside of SAP's official channels
- The extension operates within Chrome's security sandbox

## Third-Party Services

The extension only communicates with SAP's official services (`me.sap.com`). No data is shared with any other third parties.

## Your Rights

- You can disable or uninstall the extension at any time
- The extension only works when you have an active SAP session
- No data persists after uninstallation

## Updates to This Policy

We may update this privacy policy to reflect changes in the extension's functionality. Any updates will be distributed with extension updates through the Chrome Web Store.

## Contact Information

For questions about this privacy policy or the extension's data handling:
- **Author**: Marc Bernard
- **Extension**: No Nonsense Notes for SAP
- **Version**: 1.0.2

## Compliance

This extension:
- Does not track users across websites
- Does not collect personal information
- Operates in compliance with Chrome Web Store policies
- Respects SAP's terms of service for API access

---

*This privacy policy applies only to the "No Nonsense Notes for SAP" Chrome extension and does not cover SAP's own privacy practices on their websites.* 