<div align="center">
  <img src="https://github.com/1111mp/nvm-desktop/assets/31227919/67132758-8aa9-4b05-b987-18fdd5980936"/>
</div>


# nvm-desktop

A desktop client for manage the version of Nodejs.

![image](https://github.com/1111mp/nvm-desktop/assets/31227919/7d649303-ffcd-42f7-99f9-5e025918f6a1)
![image](https://github.com/1111mp/nvm-desktop/assets/31227919/da71bd37-b3bc-4e64-9c3c-ab977a5eab56)

### MacOS issues

> "File/App is damaged and cannot be opened. You should move it to Trash."

[Fix 'File/App is damaged and cannot be opened' on Mac](https://iboysoft.com/news/app-is-damaged-and-cannot-be-opened.html#:~:text=If%20you%27re%20certain%20the%20file%20or%20app%20is,and%20selecting%20Open%20twice.%204%20Restart%20your%20Mac.)

It is a Mac error that can occur to various macOS versions, such as macOS Ventura/Monterey/Big Sur/Catalina, especially on M1 Macs. It usually happens on apps or files downloaded from the web, but it can also arise when opening apps downloaded from App Store.

To fix "File/App is damaged and can't be opened" on Ventura or other macOS versions, you need to decide whether you want to keep the offending file or app.

If you are experiencing "App is damaged and cannot be opened" on macOS Ventura, do the following steps to fix it:
1. Open the Apple menu > System Settings.
2. Select Privacy & Security > Developer Tools.
3. Click the ( + ) button and navigate to the folder where the damaged app resides.
4. Select the app and click Open.

If you are encountering "Application is damaged and cannot be opened" on Big Sur/Monterey/Catalina when opening an app, try these steps:
1. Open the Apple menu > System Preferences.
2. Select Security & Privacy.
3. Tap the yellow lock and enter your password to unlock the preference pane.
4. Click "Open Anyway."

#### Temporarily disable Gatekeeper

Since the "App/File is damaged and cannot be opened" error is sent by Mac's security measures, you can temporarily turn off Gatekeeper to fix it. But it's recommended to re-enable it after using the software to protect your Mac.

Here's how to open damaged apps on Mac:

1. Launch Terminal from the Applications folder.
2. Copy and paste the following command into Terminal and hit Enter.
   ```
   sudo spctl –master-disable
   ```
3. Enter your admin password and hit Enter. (The password won't appear on the screen.)
4. Check the status of Gatekeeper by typing in the following command and pressing Enter.
  ```
  spctl --status
  ```
5. Open the damaged app.

If you want to enable Gatekeeper again, you can repeat the above process but replace the command in step 2 with `sudo spctl –master-enable`.

#### Remove the extended attributes of the damaged file or app

Another way to fix "App/File is damaged and cannot be opened" on M1 or Intel Mac is to remove the quarantine attributes signed to the file or app you are having issue opening.

1. Open Terminal from the Applications folder.
2. Type in the following command and hit Enter.
  ```
  xattr -d com.apple.quarantine file_path
  ```

To execute this command, first copy and paste `xattr -d com.apple.quarantine ` to Terminal, then drag and drop the file or app to Terminal and hit Enter. 
![WeChatae77aab16d6d535b0b106128de0736f3](https://github.com/1111mp/nvm-desktop/assets/31227919/b9f804ca-1c8e-4bb2-9f6f-f43810c9ab70)



