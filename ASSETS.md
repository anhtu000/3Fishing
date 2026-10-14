# Nguồn tài nguyên — Pond Pals

Mọi hình ảnh và âm thanh trong game đều do dự án tự tạo bằng code, không dùng tài nguyên của bên thứ ba.

| Tài nguyên | Nguồn | Giấy phép |
| --- | --- | --- |
| Toàn bộ hình (cá, thú, trứng, vật phẩm, cảnh hồ, con mèo, icon) | Vẽ bằng SVG trong `src/render/*.ts` | Của dự án |
| Hiệu ứng âm thanh và nhạc nền | Tổng hợp bằng `tools/make_audio.py` (numpy, ffmpeg) | Của dự án |
| Font Fredoka (bản cắt Latin, `src/fonts/fredoka.woff`) | Google Fonts / Fredoka Project Authors. Dự án ghép thêm ğ Ğ ş Ş İ từ dấu có sẵn trong font (`tools/build_font.py`) | SIL Open Font License 1.1, cho phép sửa đổi; font không khai Reserved Font Name (`src/fonts/Fredoka-OFL.txt`) |
| Phaser 4.2.1 | phaser.io | MIT |
| Nunito (khung chung `core/`, không hiển thị trong game này) | @fontsource/nunito | SIL OFL 1.1 |
