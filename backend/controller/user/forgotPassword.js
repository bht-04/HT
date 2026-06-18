const userModel = require("../../models/userModel");
const sendEmail = require("../../utils/sendEmail");

async function forgotPasswordController(req, res) {
  try {
    const { email } = req.body;
    if (!email) throw new Error("Vui lòng cung cấp email!");

    const user = await userModel.findOne({ email });
    if (!user) throw new Error("Email không tồn tại trong hệ thống");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 60 * 60 * 1000;

    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    const subject = "Mã OTP khôi phục mật khẩu - HTSHOP";

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mã OTP khôi phục mật khẩu</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0; 
              background-color: #f9f9f9; 
              color: #333; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff; 
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .header { 
              background-color: #a12b58; 
              padding: 25px; 
              text-align: center; 
            }
            .logo { 
              color: white; 
              font-size: 24px; 
              font-weight: bold; 
              margin: 0;
            }
            .subtitle {
              color: rgba(255,255,255,0.9);
              margin: 5px 0 0 0;
              font-size: 14px;
            }
            .content { 
              padding: 30px; 
            }
            .footer { 
              background-color: #f5f5f5; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px; 
              color: #666;
              border-top: 1px solid #eee;
            }
            .otp-code { 
              background-color: #f8f8f8; 
              border: 1px solid #e0e0e0; 
              padding: 15px; 
              text-align: center; 
              font-size: 32px; 
              font-weight: bold; 
              letter-spacing: 8px; 
              margin: 25px 0; 
              color: #a12b58;
              border-radius: 6px;
              font-family: monospace;
            }
            .note { 
              background-color: #fdf2f7; 
              border-left: 4px solid #a12b58; 
              padding: 12px 15px; 
              margin: 20px 0; 
              border-radius: 4px;
              font-size: 14px;
            }
            .social-links { 
              margin: 25px 0 15px 0; 
              text-align: center; 
            }
            .social-links p {
              margin-bottom: 12px;
              color: #666;
              font-size: 14px;
            }
            .social-links a { 
              margin: 0 8px; 
              display: inline-block; 
              text-decoration: none;
            }
            .social-icon { 
              width: 24px; 
              height: 24px; 
              opacity: 0.7;
              transition: opacity 0.2s;
            }
            .social-icon:hover {
              opacity: 1;
            }
            .btn {
              display: inline-block;
              background-color: #a12b58;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 4px;
              margin-top: 10px;
              font-size: 14px;
            }
            .text-center {
              text-align: center;
            }
            .mt-20 {
              margin-top: 20px;
            }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1 class="logo">HTSHOP</h1>
                  <p class="subtitle">Thiết bị công nghệ hàng đầu</p>
              </div>
              
              <div class="content">
                  <h3>Khôi phục mật khẩu</h3>
                  <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                  
                  <p>Vui lòng sử dụng mã OTP sau:</p>
                  
                  <div class="otp-code">${otp}</div>
                  
                  <div class="note">
                      <p><strong>Mã OTP có hiệu lực trong 60 phút</strong></p>
                      <p>Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                  </div>
                  
                  <div class="text-center mt-20">
                    <a href="#" class="btn">Đặt lại mật khẩu</a>
                  </div>

                  <div class="social-links">
                    <p>Theo dõi chúng tôi</p>
                    <a href="https://facebook.com/htshop" target="_blank">
                      <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" class="social-icon">
                    </a>
                    <a href="https://instagram.com/htshop" target="_blank">
                      <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" class="social-icon">
                    </a>
                    <a href="https://youtube.com/htshop" target="_blank">
                      <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" class="social-icon">
                    </a>
                    <a href="https://tiktok.com/@htshop" target="_blank">
                      <img src="https://cdn-icons-png.flaticon.com/512/3046/3046126.png" alt="TikTok" class="social-icon">
                    </a>
                  </div>
              </div>
              
              <div class="footer">
                  <p>© 2023 HTSHOP. Tất cả quyền được bảo lưu.</p>
                  <p>htshop18092025@gmail.com | Hotline: 1900 2480</p>
                  <p>Email tự động - vui lòng không trả lời</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const text = `Mã OTP khôi phục mật khẩu HTSHOP: ${otp}\nHiệu lực: 60 phút\n\nVui lòng không chia sẻ mã này.\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.`;

    const mailResult = await sendEmail({ to: email, subject, text, html });
    if (!mailResult.success) throw new Error("Không thể gửi OTP đến email này");

    res.json({
      message: "OTP đã gửi về email của bạn",
      success: true,
      error: false,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || err, success: false, error: true });
  }
}

module.exports = forgotPasswordController;
