using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Diagnostics;
using System.Threading;

namespace Hospital3D
{
    class Program
    {
        private static HttpListener _listener;
        private static string _webRoot;
        private static volatile bool _running = true;

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string distDir = Path.Combine(baseDir, "dist");
                _webRoot = Directory.Exists(distDir) ? distDir : baseDir;

                int port = GetAvailablePort(49152);
                string prefix = string.Format("http://127.0.0.1:{0}/", port);

                _listener = new HttpListener();
                _listener.Prefixes.Add(prefix);
                _listener.Start();

                Thread serverThread = new Thread(RunServer);
                serverThread.IsBackground = true;
                serverThread.Start();

                string browserExe = FindBrowser();
                string appUrl = prefix + "index.html";

                Process gameProcess = null;

                if (!string.IsNullOrEmpty(browserExe) && File.Exists(browserExe))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = browserExe;
                    psi.Arguments = string.Format(
                        "--app=\"{0}\" --window-size=1440,900 --disable-extensions --autoplay-policy=no-user-gesture-required --enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist",
                        appUrl
                    );
                    psi.UseShellExecute = false;
                    gameProcess = Process.Start(psi);
                }
                else
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = appUrl;
                    psi.UseShellExecute = true;
                    gameProcess = Process.Start(psi);
                }

                if (gameProcess != null)
                {
                    gameProcess.WaitForExit();
                }
                else
                {
                    while (_running)
                    {
                        Thread.Sleep(1000);
                    }
                }
            }
            catch (Exception)
            {
                // Silently exit
            }
            finally
            {
                _running = false;
                try
                {
                    if (_listener != null && _listener.IsListening)
                    {
                        _listener.Stop();
                        _listener.Close();
                    }
                }
                catch { }
            }
        }

        private static int GetAvailablePort(int startingPort)
        {
            for (int port = startingPort; port < startingPort + 500; port++)
            {
                try
                {
                    TcpListener l = new TcpListener(IPAddress.Loopback, port);
                    l.Start();
                    l.Stop();
                    return port;
                }
                catch
                {
                    continue;
                }
            }
            return 5173;
        }

        private static string FindBrowser()
        {
            string[] paths = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe"),
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string p in paths)
            {
                if (File.Exists(p)) return p;
            }

            return null;
        }

        private static void RunServer()
        {
            while (_running && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem(ProcessRequest, context);
                }
                catch
                {
                    break;
                }
            }
        }

        private static void ProcessRequest(object state)
        {
            HttpListenerContext context = (HttpListenerContext)state;
            try
            {
                string urlPath = context.Request.Url.LocalPath.TrimStart('/');
                if (string.IsNullOrEmpty(urlPath)) urlPath = "index.html";

                urlPath = urlPath.Replace('/', Path.DirectorySeparatorChar);
                string filePath = Path.Combine(_webRoot, urlPath);

                if (File.Exists(filePath))
                {
                    byte[] data = File.ReadAllBytes(filePath);
                    context.Response.ContentType = GetMimeType(filePath);
                    context.Response.ContentLength64 = data.Length;
                    context.Response.AddHeader("Cache-Control", "no-cache");
                    context.Response.OutputStream.Write(data, 0, data.Length);
                }
                else
                {
                    context.Response.StatusCode = 404;
                }
            }
            catch
            {
                context.Response.StatusCode = 500;
            }
            finally
            {
                try { context.Response.OutputStream.Close(); } catch { }
            }
        }

        private static string GetMimeType(string path)
        {
            string ext = Path.GetExtension(path).ToLowerInvariant();
            switch (ext)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".woff": return "font/woff";
                case ".woff2": return "font/woff2";
                case ".ttf": return "font/ttf";
                default: return "application/octet-stream";
            }
        }
    }
}
