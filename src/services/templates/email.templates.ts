export const GetWelcomeEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5; }
    .header { background-color: #000000; padding: 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; }
    .content { padding: 30px; color: #333333; line-height: 1.6; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #888888; background-color: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>WELCOME</h1>
    </div>
    <div class="content">
      <h2>สวัสดีคุณ ${name},</h2>
      <p>ยินดีต้อนรับเข้าสู่ระบบของเราอย่างเป็นทางการ บัญชีของคุณถูกสร้างและพร้อมใช้งานเรียบร้อยแล้ว!</p>
      <p>คุณสามารถเริ่มต้นสัมผัสประสบการณ์และใช้งานฟีเจอร์ที่เราเตรียมไว้ให้ได้ทันที หากคุณมีข้อสงสัยใด ๆ ไม่ต้องลังเลที่จะติดต่อทีมงานของเราครับ</p>
      <br />
      <p>ขอแสดงความนับถือ,<br>ทีมงานผู้พัฒนาระบบ</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Our Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

export const GetPasswordResetTemplate = (resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5; }
    .header { background-color: #000000; padding: 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; }
    .content { padding: 30px; color: #333333; line-height: 1.6; text-align: center; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #888888; background-color: #f9f9f9; }
    .warning { font-size: 11px; margin-top: 30px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PASSWORD RESET</h1>
    </div>
    <div class="content">
      <h2>คำขอรีเซ็ตรหัสผ่าน</h2>
      <p>เราได้รับการแจ้งเตือนคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีของคุณแล้ว</p>
      <p>คุณสามารถคลิกที่ปุ่มด้านล่างเพื่อดำเนินการตั้งรหัสผ่านใหม่:</p>
      <a href="${resetUrl}" class="btn">ตั้งรหัสผ่านใหม่</a>
      
      <p class="warning">ลิงก์นี้จะมีอายุการใช้งาน 1 ชั่วโมง<br>หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้ ระบบยังคงปลอดภัย</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Our Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

export const GetEmailVerificationTemplate = (verifyUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5; }
    .header { background-color: #000000; padding: 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; }
    .content { padding: 30px; color: #333333; line-height: 1.6; text-align: center; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #888888; background-color: #f9f9f9; }
    .warning { font-size: 11px; margin-top: 30px; color: #999999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VERIFY EMAIL</h1>
    </div>
    <div class="content">
      <h2>Confirm your email address</h2>
      <p>Click the button below to verify this email address and finish securing your account.</p>
      <a href="${verifyUrl}" class="btn">Verify email</a>
      <p class="warning">This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Our Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

export const GetTeamInviteTemplate = (
  inviterName: string,
  tenantName: string,
  inviteUrl: string
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5; }
    .header { background-color: #000000; padding: 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; }
    .content { padding: 30px; color: #333333; line-height: 1.6; text-align: center; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    .highlight { font-weight: bold; color: #000000; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #888888; background-color: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TEAM INVITATION</h1>
    </div>
    <div class="content">
      <h2>คุณได้รับคำเชิญเข้าร่วมทีม!</h2>
      <p>คุณ <span class="highlight">${inviterName}</span> ได้ส่งคำเชิญให้คุณเข้าร่วมพื้นที่ทำงาน (Workspace) ใน <span class="highlight">${tenantName}</span></p>
      <p>มาสร้างสรรค์ผลงานร่วมกันกับทีมของคุณโดยคลิกที่ปุ่มด้านล่างครับ:</p>
      <a href="${inviteUrl}" class="btn">ตอบรับคำเชิญ</a>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Our Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
