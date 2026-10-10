# FileBrowser Quantum

## Documentation

- [FileBrowser Quantum documentation](https://filebrowserquantum.com/) — the upstream manual.

## What you get on StartOS

This package tracks Quantum's stable release line. A `-stable` suffix in its displayed version identifies that line, not a beta release.

FileBrowser Quantum is the same web file manager as File Browser, picked up and maintained by a different developer after the original project stopped. Upload, organize, preview and share files from a browser.

Compared to File Browser you also get search that returns results as you type, previews for office documents, video and 3D models, access control down to individual folders, and the ability to mount your files as a network drive over WebDAV.

## Switching from File Browser

If you already run File Browser, this is the same marketplace listing — open it and switch the flavor. Your files, your user accounts and everyone's existing passwords come across; you sign in exactly as before and there is no admin password to set.

**Read this before you switch.** Two things do not come across:

- **Folder restrictions on other people's accounts are lost.** If you gave someone an account that could only see one folder, after switching they will be able to see everything on the drive. Go through every account that isn't yours and set its folder again. If that isn't acceptable, don't switch until you've planned for it.
- **Share links you handed out stop working.** They will need to be created again.

Access rules also have to be recreated, and File Browser's shell commands are gone for good — the developer removed them on purpose.

**Take a StartOS backup before switching.** The switch is one-way — File Browser is no longer maintained, so StartOS will not let you go back to it. If you change your mind later, restoring that backup is the only way to run File Browser again. Your files themselves are not at risk either way; what the backup protects is your user accounts and settings.

## Updating FileBrowser Quantum

**Take a backup before updating.** The first start imports your existing accounts and settings into the new database format. Allow extra time and disk space for this and for rebuilding the search index. Sign in with your existing credentials, then check other users' folder permissions and your share links.

The update also adds activity logs and per-source file permissions in the web interface. If you use scripts that call the download API, check the upstream migration guide for the changed routes.

Going back requires restoring your pre-update backup. The retained old database does not receive any changes made after updating.

## Getting set up

If you're **switching from File Browser**, there is nothing to do: start it and sign in with your existing credentials.

If this is a **fresh install**:

1. StartOS will show a task telling you to set an admin password — the service will not start until you do.
2. Run the **Set Admin Password** action. It shows you a username (`admin`) and a generated password once. **Copy them into your password manager now.**
3. Start FileBrowser Quantum and open the **Web UI**, then sign in.

## Using FileBrowser Quantum

### Web interface

Upload by dragging files onto the page. Click a file to preview it — images, video, audio, PDFs, office documents and 3D models all open in the browser.

The search box returns results as you type once the index has been built. On a large drive the first index takes a while; it runs in the background and search gets better as it goes.

Create accounts for other people from the settings menu, and give each one the folders they should see.

### Connecting as a network drive

WebDAV is served at `/dav` on the same address as the web interface, so you can map your files as a drive in Windows Explorer, macOS Finder, or a Linux file manager. Sign in with your FileBrowser Quantum username and password.

### Actions

**Set Admin Password** — generates a new random password for the `admin` account. Use it on a fresh install, or any time you want to rotate the credential. FileBrowser Quantum must be stopped to run it, to avoid racing the running server's cached account settings. Once an admin password exists, it asks you to confirm first, because the current password stops working and any two-factor login on the `admin` account is turned off.

**Set Session Timeout** — how many hours you stay signed in before your browser session ends and you have to log in again. Defaults to 12 hours. If you switched from File Browser, your existing setting is carried over. Changing it restarts the service, which signs everyone out once.
