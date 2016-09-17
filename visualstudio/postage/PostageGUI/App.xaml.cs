using Microsoft.Win32;
using System.Collections.Generic;
using System.Windows.Forms;
using System.Diagnostics;
using System.Reflection;
using System.Drawing;
using System.IO;
using System;

namespace PostageGUI {
	public partial class App : System.Windows.Application {
		private NotifyIcon _notifyIcon;
		private Process _postage;
		private string location;
		private Dictionary<string, string> config;
		private bool bolTLS;

		protected override void OnStartup(System.Windows.StartupEventArgs e) {
			base.OnStartup(e);

			try {
				RegistryKey regKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry32).OpenSubKey("Software\\Workflow Products\\Postage");
				if (regKey == null) {
					regKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64).OpenSubKey("Software\\Workflow Products\\Postage");
				}
				location = regKey.GetValue("InstallDir").ToString();
			} catch (Exception ex) {
				MessageBox.Show(ex.Message, "Couldn't find postage");
				Environment.Exit(0);
			}

			ProcessStartInfo startInfo = new ProcessStartInfo();
			startInfo.FileName = location + "bin\\postage.exe";
			startInfo.Arguments = "-c " + location + "config\\postage.conf -d " + location + "config\\postage-connections.conf";
			startInfo.WindowStyle = ProcessWindowStyle.Hidden;
			try {
				_postage = Process.Start(startInfo);
			} catch (Exception ex) {
				MessageBox.Show(ex.Message, "Couldn't start up postage");
				Environment.Exit(0);
			}

			config = new Dictionary<string, string>();
			config.Add("tls_cert", null);
			config.Add("tls_key", null);
			config.Add("postage_port", null);

			ReadConfig(location + "config\\postage.conf");

			bolTLS =	config["tls_cert"] != null &&
						config["tls_key"] != null;

			_notifyIcon = new NotifyIcon();
			_notifyIcon.Icon = new Icon("postage_favicon.ico");
			_notifyIcon.Visible = true;

			CreateContextMenu();
		}

		private void ReadConfig(string strFile) {
			char[] arrSplitOn = { '=', ':' };
			try {
				foreach (string strLine in File.ReadLines(strFile)) {
					if (!string.IsNullOrEmpty(strLine) && strLine[0] != '#' && strLine[0] != ';') {
						int intIndexOfEquals = strLine.IndexOfAny(arrSplitOn);
						string strKey = strLine.Substring(0, intIndexOfEquals).Trim();
						string strValue = strLine.Substring(intIndexOfEquals + 1).Trim();

						if (config.ContainsKey(strKey)) {
							config[strKey] = strValue;
						} else {
							config.Add(strKey, strValue);
						}
					}
				}
			} catch (Exception ex) {
				MessageBox.Show(ex.Message, "Couldn't read postage.conf");
				Environment.Exit(0);
			}
		}

		private void CreateContextMenu() {
			_notifyIcon.ContextMenuStrip = new ContextMenuStrip();

			string strConnectionFile = location + "config\\postage-connections.conf";
			try {
				foreach (string strLine in File.ReadLines(strConnectionFile)) {
					if (!string.IsNullOrEmpty(strLine) && strLine[0] != '#') {
						int intSepPos = strLine.IndexOf(':');
						if (intSepPos <= 0) {
							MessageBox.Show("Could not find colon on line:\n" + strLine, "Couldn't read postage-connections.conf");
							Environment.Exit(0);
						}
						string strName = strLine.Substring(0, intSepPos);
						_notifyIcon.ContextMenuStrip.Items.Add("Connect to \"" + strName + "\"").Click +=
												(s, e) => Process.Start("http" + (bolTLS ? "s" : "") + "://127.0.0.1:" + COALESCE(config["postage_port"], "8080") + "/postage/index.html?connection=" + Uri.EscapeUriString(strName));
					}
				}
			} catch (Exception ex) {
				MessageBox.Show(ex.Message, "Couldn't read postage-connections.conf");
				Environment.Exit(0);
			}

			ProcessStartInfo startInfo = new ProcessStartInfo();
			// Redirect the output stream of the child process.
			startInfo.UseShellExecute = false;
			startInfo.RedirectStandardOutput = true;
			startInfo.FileName = location + "bin\\postage.exe";
			startInfo.Arguments = "-v";
			startInfo.WindowStyle = ProcessWindowStyle.Hidden;
			Process p = Process.Start(startInfo);
			// Do not wait for the child process to exit before
			// reading to the end of its redirected stream.
			// p.WaitForExit();
			// Read the output stream first and then wait.
			string strVersion = p.StandardOutput.ReadToEnd();
			p.WaitForExit();
			strVersion = strVersion.Substring(8);

			_notifyIcon.Click += (s, e) => ShowContextMenu();
			_notifyIcon.DoubleClick +=
									(s, e) => Process.Start("https://news.workflowproducts.com/splash/postage.html?app=postage&version=" + strVersion);

			_notifyIcon.ContextMenuStrip.Items.Add("-");
			_notifyIcon.ContextMenuStrip.Items.Add("About").Click +=
									(s, e) => Process.Start("https://news.workflowproducts.com/splash/postage.html?app=postage&version=" + strVersion);
			_notifyIcon.ContextMenuStrip.Items.Add("-");
			_notifyIcon.ContextMenuStrip.Items.Add("Config Folder").Click +=
									(s, e) => Process.Start(location + "config\\");
			_notifyIcon.ContextMenuStrip.Items.Add("-");
			_notifyIcon.ContextMenuStrip.Items.Add("Postage Command Line Options").Click +=
									(s, e) => Process.Start(location + "\\doc\\postage.1.html");
			_notifyIcon.ContextMenuStrip.Items.Add("-");
			_notifyIcon.ContextMenuStrip.Items.Add("Quit").Click +=
									(s, e) => ExitApplication();
		}

		private void ShowContextMenu() {
			// Thank you Hans Passant:
			// http://stackoverflow.com/a/2208910
			MethodInfo mi = typeof(NotifyIcon).GetMethod("ShowContextMenu", BindingFlags.Instance | BindingFlags.NonPublic);
			mi.Invoke(_notifyIcon, null);
		}

		private string NullIf(string A, string B) {
			return A == B ? null : A;
		}

		private string COALESCE(string A, string B) {
			return A != null ? A : B;
		}

		private void ExitApplication() {
			try {
				_postage.Kill();
			} catch (Exception ex) {
				MessageBox.Show(ex.Message, "Couldn't shut down postage");
			} finally {
				_notifyIcon.Dispose();
				_notifyIcon = null;
				Environment.Exit(0);
			}
		}
	}
}
