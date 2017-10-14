namespace SpotCafe.Desktop {
    partial class SecureForm {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing) {
            if (disposing && (components != null)) {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent() {
            this.panelContentWrapper = new System.Windows.Forms.Panel();
            this.textBoxSignInEror = new System.Windows.Forms.TextBox();
            this.progressBarSignInTimeout = new System.Windows.Forms.ProgressBar();
            this.buttonSignIn = new System.Windows.Forms.Button();
            this.textBoxPassword = new System.Windows.Forms.TextBox();
            this.textBoxUsername = new System.Windows.Forms.TextBox();
            this.panelContentWrapper.SuspendLayout();
            this.SuspendLayout();
            // 
            // panelContentWrapper
            // 
            this.panelContentWrapper.Anchor = System.Windows.Forms.AnchorStyles.None;
            this.panelContentWrapper.Controls.Add(this.textBoxSignInEror);
            this.panelContentWrapper.Controls.Add(this.progressBarSignInTimeout);
            this.panelContentWrapper.Controls.Add(this.buttonSignIn);
            this.panelContentWrapper.Controls.Add(this.textBoxPassword);
            this.panelContentWrapper.Controls.Add(this.textBoxUsername);
            this.panelContentWrapper.Location = new System.Drawing.Point(226, 107);
            this.panelContentWrapper.Name = "panelContentWrapper";
            this.panelContentWrapper.Size = new System.Drawing.Size(380, 241);
            this.panelContentWrapper.TabIndex = 0;
            this.panelContentWrapper.Visible = false;
            // 
            // textBoxSignInEror
            // 
            this.textBoxSignInEror.BackColor = System.Drawing.Color.Black;
            this.textBoxSignInEror.BorderStyle = System.Windows.Forms.BorderStyle.None;
            this.textBoxSignInEror.Font = new System.Drawing.Font("Microsoft Sans Serif", 16F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.textBoxSignInEror.ForeColor = System.Drawing.Color.Tomato;
            this.textBoxSignInEror.Location = new System.Drawing.Point(3, 116);
            this.textBoxSignInEror.Multiline = true;
            this.textBoxSignInEror.Name = "textBoxSignInEror";
            this.textBoxSignInEror.ReadOnly = true;
            this.textBoxSignInEror.Size = new System.Drawing.Size(374, 52);
            this.textBoxSignInEror.TabIndex = 3;
            this.textBoxSignInEror.Visible = false;
            // 
            // progressBarSignInTimeout
            // 
            this.progressBarSignInTimeout.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(0)))), ((int)(((byte)(192)))));
            this.progressBarSignInTimeout.Location = new System.Drawing.Point(3, 112);
            this.progressBarSignInTimeout.Margin = new System.Windows.Forms.Padding(0);
            this.progressBarSignInTimeout.Maximum = 60;
            this.progressBarSignInTimeout.Name = "progressBarSignInTimeout";
            this.progressBarSignInTimeout.Size = new System.Drawing.Size(374, 1);
            this.progressBarSignInTimeout.Step = 1;
            this.progressBarSignInTimeout.Style = System.Windows.Forms.ProgressBarStyle.Continuous;
            this.progressBarSignInTimeout.TabIndex = 1;
            this.progressBarSignInTimeout.Value = 60;
            // 
            // buttonSignIn
            // 
            this.buttonSignIn.FlatAppearance.BorderColor = System.Drawing.Color.DarkBlue;
            this.buttonSignIn.FlatAppearance.MouseDownBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(0)))), ((int)(((byte)(32)))));
            this.buttonSignIn.FlatAppearance.MouseOverBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(0)))), ((int)(((byte)(64)))));
            this.buttonSignIn.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.buttonSignIn.Font = new System.Drawing.Font("Microsoft Sans Serif", 28F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.buttonSignIn.ForeColor = System.Drawing.Color.DarkGray;
            this.buttonSignIn.Location = new System.Drawing.Point(3, 174);
            this.buttonSignIn.Name = "buttonSignIn";
            this.buttonSignIn.Size = new System.Drawing.Size(374, 64);
            this.buttonSignIn.TabIndex = 2;
            this.buttonSignIn.Text = "Sign in";
            this.buttonSignIn.UseVisualStyleBackColor = false;
            this.buttonSignIn.Click += new System.EventHandler(this.buttonSignIn_Click);
            // 
            // textBoxPassword
            // 
            this.textBoxPassword.BackColor = System.Drawing.Color.Black;
            this.textBoxPassword.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.textBoxPassword.Font = new System.Drawing.Font("Microsoft Sans Serif", 28F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.textBoxPassword.ForeColor = System.Drawing.Color.DimGray;
            this.textBoxPassword.Location = new System.Drawing.Point(3, 59);
            this.textBoxPassword.Name = "textBoxPassword";
            this.textBoxPassword.Size = new System.Drawing.Size(374, 50);
            this.textBoxPassword.TabIndex = 1;
            this.textBoxPassword.UseSystemPasswordChar = true;
            // 
            // textBoxUsername
            // 
            this.textBoxUsername.BackColor = System.Drawing.Color.Black;
            this.textBoxUsername.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.textBoxUsername.Font = new System.Drawing.Font("Microsoft Sans Serif", 28F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.textBoxUsername.ForeColor = System.Drawing.Color.Lavender;
            this.textBoxUsername.Location = new System.Drawing.Point(3, 3);
            this.textBoxUsername.Name = "textBoxUsername";
            this.textBoxUsername.Size = new System.Drawing.Size(374, 50);
            this.textBoxUsername.TabIndex = 0;
            // 
            // SecureForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.Black;
            this.ClientSize = new System.Drawing.Size(865, 467);
            this.Controls.Add(this.panelContentWrapper);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "SecureForm";
            this.ShowIcon = false;
            this.ShowInTaskbar = false;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.TopMost = true;
            this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
            this.panelContentWrapper.ResumeLayout(false);
            this.panelContentWrapper.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Panel panelContentWrapper;
        private System.Windows.Forms.Button buttonSignIn;
        private System.Windows.Forms.TextBox textBoxPassword;
        private System.Windows.Forms.TextBox textBoxUsername;
        private System.Windows.Forms.ProgressBar progressBarSignInTimeout;
        private System.Windows.Forms.TextBox textBoxSignInEror;
    }
}