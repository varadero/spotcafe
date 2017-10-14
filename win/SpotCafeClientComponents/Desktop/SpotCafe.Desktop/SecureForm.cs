using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SpotCafe.Desktop {
    public partial class SecureForm : Form {
        public event EventHandler<SignInEventArgs> SignIn;

        private SecureFormState _state;

        public SecureForm() {
            InitializeComponent();
        }

        public void Start(SecureFormStartArgs args) {
            InitializeState(args);
#if DEBUG
            TopMost = false;
            MaximizeBox = true;
            MinimizeBox = true;
            ShowIcon = true;
            ShowInTaskbar = true;
            WindowState = FormWindowState.Normal;
            FormBorderStyle = FormBorderStyle.Sizable;
            Size = new Size(1024, 768);
            Location = new Point(200, 200);
            Refresh();
#else
            _state.StayOnTopTimer.Start();
#endif
        }

        public void SignInResult(bool isOk, string errorMessage) {
            if (InvokeRequired) {
                Invoke((MethodInvoker)delegate { SignInResult(isOk, errorMessage); });
                return;
            }
            ShowContentPanel();
            if (isOk) {
                return;
            }
            ShowSignInError(errorMessage);
        }

        private void ShowSignInError(string errorMessage) {
            textBoxSignInEror.Text = errorMessage;
            textBoxSignInEror.Show();
        }

        private void ClearSignInError() {
            textBoxSignInEror.Text = "";
            textBoxSignInEror.Hide();
        }

        private void buttonSignIn_Click(object sender, EventArgs e) {
            ClearSignInError();
            OnSignIn();
        }

        protected virtual void OnSignIn() {
            var args = new SignInEventArgs {
                Username = textBoxUsername.Text,
                Password = textBoxPassword.Text
            };
            SignIn?.Invoke(this, args);
            if (args.Success) {

            } else {

            }
        }

        private void StayOnTopTimer_Tick(object sender, EventArgs e) {
            SetOnTop();
            HideCursorIfIdle();
        }

        private void SetOnTop() {
            Interop.SetWindowPos(Handle, Interop.HWND_TOPMOST, 0, 0, _state.ScreenBounds.Width, _state.ScreenBounds.Height, Interop.SWP_SHOWWINDOW);
        }

        protected override void OnClick(EventArgs e) {
            ShowContentPanel();
            base.OnClick(e);
        }

        private void ShowContentPanel() {
            _state.ContentPanelVisibilitySeconds = _state.ContentPanelVisibilityDuration;
            progressBarSignInTimeout.Value = _state.ContentPanelVisibilitySeconds;
            panelContentWrapper.Visible = true;
            _state.PanelContentVisibilityTimer.Start();
        }

        private void HideCursorIfIdle() {
            //var idleTime = Interop.GetIdleTime();
            //if (idleTime > _state.CursorIdleTime) {
            //    Cursor.Hide();
            //} else {
            //    Cursor.Show();
            //}
        }

        private void ClearSignInData() {
            textBoxUsername.Text = "";
            textBoxPassword.Text = "";
            ClearSignInError();
        }

        private void PanelContentVisibilityTimer_Tick(object sender, EventArgs e) {
            _state.ContentPanelVisibilitySeconds--;
            if (_state.ContentPanelVisibilitySeconds <= 0) {
                panelContentWrapper.Visible = false;
                ClearSignInData();
                progressBarSignInTimeout.Value = _state.ContentPanelVisibilityDuration;
                var timer = (Timer)sender;
                timer.Stop();
            } else {
                progressBarSignInTimeout.Value = _state.ContentPanelVisibilitySeconds;
            }
        }

        protected override void OnSizeChanged(EventArgs e) {
            panelContentWrapper.Left = (this.ClientSize.Width - panelContentWrapper.Width) / 2;
            panelContentWrapper.Top = (this.ClientSize.Height - panelContentWrapper.Height) / 2;
            base.OnSizeChanged(e);
        }

        private void InitializeState(SecureFormStartArgs args) {
            _state = new SecureFormState();

            _state.StartAgs = args;

            _state.ContentPanelVisibilityDuration = 60;
            _state.ContentPanelVisibilitySeconds = _state.ContentPanelVisibilityDuration;
            progressBarSignInTimeout.Maximum = _state.ContentPanelVisibilityDuration;


            _state.ScreenBounds = Screen.FromControl(this).Bounds;

            _state.StayOnTopTimer = new Timer();
            _state.StayOnTopTimer.Interval = (int)TimeSpan.FromSeconds(3).TotalMilliseconds;
            _state.StayOnTopTimer.Tick += StayOnTopTimer_Tick;

            _state.PanelContentVisibilityTimer = new Timer();
            _state.PanelContentVisibilityTimer.Interval = (int)TimeSpan.FromSeconds(1).TotalMilliseconds;
            _state.PanelContentVisibilityTimer.Tick += PanelContentVisibilityTimer_Tick;
        }

        private class SecureFormState {
            public SecureFormStartArgs StartAgs { get; set; }
            public Timer StayOnTopTimer { get; set; }
            public Rectangle ScreenBounds { get; set; }
            public int ContentPanelVisibilityDuration { get; set; }
            public int ContentPanelVisibilitySeconds { get; set; }
            public Timer PanelContentVisibilityTimer { get; set; }
        }
    }
}
