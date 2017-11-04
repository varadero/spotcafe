namespace SpotCafe.Desktop {
    partial class MainForm {
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
            this.buttonApplicationGroup = new System.Windows.Forms.Button();
            this.flowPanelAppFiles = new System.Windows.Forms.FlowLayoutPanel();
            this.SuspendLayout();
            // 
            // buttonApplicationGroup
            // 
            this.buttonApplicationGroup.FlatAppearance.BorderColor = System.Drawing.Color.DarkBlue;
            this.buttonApplicationGroup.FlatAppearance.MouseDownBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(0)))), ((int)(((byte)(32)))));
            this.buttonApplicationGroup.FlatAppearance.MouseOverBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(0)))), ((int)(((byte)(0)))), ((int)(((byte)(64)))));
            this.buttonApplicationGroup.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.buttonApplicationGroup.Font = new System.Drawing.Font("Microsoft Sans Serif", 28F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(204)));
            this.buttonApplicationGroup.ForeColor = System.Drawing.Color.DarkGray;
            this.buttonApplicationGroup.Location = new System.Drawing.Point(12, 12);
            this.buttonApplicationGroup.Name = "buttonApplicationGroup";
            this.buttonApplicationGroup.Size = new System.Drawing.Size(374, 64);
            this.buttonApplicationGroup.TabIndex = 3;
            this.buttonApplicationGroup.UseVisualStyleBackColor = false;
            this.buttonApplicationGroup.Visible = false;
            // 
            // flowPanelAppFiles
            // 
            this.flowPanelAppFiles.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.flowPanelAppFiles.AutoScroll = true;
            this.flowPanelAppFiles.BackColor = System.Drawing.Color.Black;
            this.flowPanelAppFiles.Location = new System.Drawing.Point(0, 104);
            this.flowPanelAppFiles.Name = "flowPanelAppFiles";
            this.flowPanelAppFiles.Size = new System.Drawing.Size(1239, 597);
            this.flowPanelAppFiles.TabIndex = 5;
            // 
            // MainForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.Black;
            this.ClientSize = new System.Drawing.Size(1239, 713);
            this.Controls.Add(this.flowPanelAppFiles);
            this.Controls.Add(this.buttonApplicationGroup);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "MainForm";
            this.ShowIcon = false;
            this.ShowInTaskbar = false;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button buttonApplicationGroup;
        private System.Windows.Forms.FlowLayoutPanel flowPanelAppFiles;
    }
}

