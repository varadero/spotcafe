using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO;

namespace SpotCafe.Desktop {
    public partial class ApplicationFileControl : UserControl {

        public event EventHandler Clicked;

        public ApplicationFileControl() {
            InitializeComponent();
        }

        public void SetData(string imageData, string title, string description) {
            try {
                if (imageData.StartsWith("data:")) {
                    imageData = imageData.Substring(imageData.IndexOf(",") + 1);
                }
                var pic = Convert.FromBase64String(imageData);
                using (MemoryStream ms = new MemoryStream(pic)) {
                    //pictureMain.Image = Image.FromStream(ms);
                    BackgroundImage = Image.FromStream(ms);
                }
            } catch {
                //pictureMain.Image = null;
                BackgroundImage = null;
            }
            labelTitle.Text = title;
            //labelDescription.Text = description;
        }

        private void ApplicationFileControl_Click(object sender, EventArgs e) {
            Clicked?.Invoke(this, EventArgs.Empty);
        }
    }
}
