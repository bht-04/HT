const userModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const sendEmail = require("../../utils/sendEmail");

async function userSignUpController(req, res) {
  try {
    const { email, password, name } = req.body;

    const user = await userModel.findOne({ email });
    if (user) {
      throw new Error("Người dùng đã tồn tại!");
    }

    if (!email) throw new Error("Vui lòng cung cấp email!");
    if (!password) throw new Error("Vui lòng cung cấp mật khẩu!");
    if (!name) throw new Error("Vui lòng cung cấp họ và tên");


    const welcomeSubject = "Chào mừng bạn đến với HTSHOP - Đăng ký thành công!";

    const welcomeHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Chào mừng đến với HTSHOP</title>
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
            .button { 
              background-color: #a12b58; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              display: inline-block; 
              margin: 20px 0; 
              font-weight: bold;
              transition: background-color 0.3s;
            }
            .button:hover {
              background-color: #8a1f49;
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
              width: 32px; 
              height: 32px; 
              opacity: 0.7;
              transition: opacity 0.2s;
            }
            .social-icon:hover {
              opacity: 1;
            }
            .benefits {
              margin: 20px 0;
            }
            .benefits ul {
              padding-left: 20px;
            }
            .benefits li {
              margin-bottom: 8px;
              line-height: 1.5;
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
                  <h3>Xin chào ${name},</h3>
                  <p>Cảm ơn bạn đã đăng ký tài khoản tại HTSHOP - Thiết bị công nghệ. Chúng tôi rất vui mừng được chào đón bạn trở thành thành viên của cộng đồng công nghệ hàng đầu Việt Nam.</p>
                  
                  <p>Với tài khoản HTSHOP, bạn có thể:</p>
                  <div class="benefits">
                    <ul>
                        <li>Theo dõi đơn hàng và lịch sử mua hàng</li>
                        <li>Nhận thông báo về sản phẩm mới và khuyến mãi đặc biệt</li>
                        <li>Lưu trữ danh sách sản phẩm yêu thích</li>
                        <li>Đánh giá sản phẩm bạn đã mua</li>
                        <li>Và nhiều ưu đãi độc quyền khác...</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center;">
                      <a href="https://shopht.io.vn" class="button">Khám phá ngay</a>
                  </div>
                  
                  <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
                  
                  <div class="social-links">
                    <p>Theo dõi chúng tôi trên:</p>
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
                  <p>© 2023 HTSHOP - Thiết bị công nghệ. Tất cả quyền được bảo lưu.</p>
                  <p>Địa chỉ: 59 Ngô Mây, Bình Định, Việt Nam</p>
                  <p>Email: htshop18092025@gmail.com | Hotline: 1900 2480</p>
                  <p>Bạn nhận được email này vì đã đăng ký tài khoản trên htshop.io.vn</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const welcomeText = `Xin chào ${name},\n\nCảm ơn bạn đã đăng ký tài khoản tại HTSHOP - Thiết bị công nghệ. Chúng tôi rất vui mừng được chào đón bạn trở thành thành viên của cộng đồng công nghệ hàng đầu Việt Nam.\n\nTruy cập https://htshop.vn để khám phá ngay.\n\nTrân trọng,\nĐội ngũ HTSHOP`;


    const mailResult = await sendEmail({
      to: email,
      subject: welcomeSubject,
      text: welcomeText,
      html: welcomeHtml,
    });
    if (!mailResult.success) {

      throw new Error("Không thể gửi email. Vui lòng đăng ký bằng Gmail thật.");
    }

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);
    if (!hashPassword) throw new Error("Có gì đó không ổn?");

    const payload = {
      name,
      email,
      role: "Người Dùng",
      password: hashPassword,
      isVerified: true,
    };

    const userData = new userModel(payload);
    const saveUser = await userData.save();

    res.status(201).json({
      data: { _id: saveUser._id, email: saveUser.email, name: saveUser.name },
      success: true,
      error: false,
      message: "Tạo tài khoản thành công!",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = userSignUpController;
