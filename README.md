# Game #3 — Pond Pals: Hatch & Fish (v1.2)

Game câu cá thư giãn một chạm, ấp trứng ra thú cưng giúp câu. Đường phát hành A: Poki (độc quyền web).
Tài liệu thiết kế: `Pond-Pals-Tai-lieu-thiet-ke.md` (cùng thư mục cha) và bản Docs.

## Chạy

```
npm install
npm run dev            # chơi thử trên máy, mở http://localhost:5173
npm run build          # bản Poki (SDK v2) -> dist/poki, kèm kiểm tra dung lượng
npm run build:single   # một file HTML để thử trên điện thoại
npm test               # test khung chung + luật game
npm run sim            # mô phỏng cân bằng 1 giờ chơi
npm run audio          # tạo lại âm thanh (cần python3, numpy, ffmpeg)
```

Trên bản web có preset để chụp màn hình: `#dev-rich` (đủ xu, sẵn boss), `#dev-misty` (hồ 2), `#dev-frozen` (hồ 3). Đổi ngôn ngữ để thử: `?lang=de` (en, fr, it, de, es, tr).

## Cấu trúc

- `core/` khung chung (đồng bộ từ game #1), thêm adapter Poki `core/platform/poki.ts`.
- `src/content/data.ts` nội dung: 3 hồ, 24 cá, 15 thú, 3 boss, nâng cấp, nhiệm vụ.
- `src/i18n/` chữ của game theo 6 ngôn ngữ; `t.ts` là hàm dịch; `i18n.test.ts` kiểm đủ khóa.
- `src/logic/` luật thuần TypeScript (giá, may mắn, trứng, thú, nhiệm vụ) và máy trạng thái câu cá; có test.
- `src/render/` toàn bộ hình vẽ SVG; `textures.ts` nạp thành texture lúc loading.
- `src/world/` cảnh hồ động (`Pond.ts`) và mèo + cần + dây + phao (`Rig.ts`).
- `src/ui/` bộ UI riêng của game (nút, bảng, HUD, thẻ bắt cá, nở trứng, các menu).
- `src/scenes/PlayScene.ts` ghép tất cả: vòng câu, hướng dẫn, boss, quảng cáo, thu offline.
- `tools/` build bằng Bun, chụp màn hình, bot chơi thử (`play.mjs`), sim, tạo âm thanh.

## Poki

- Quy định và checklist trước khi nộp: `docs/Poki-Huong-dan.md` (dùng chung cho mọi game đường A).
- Thumbnail cửa hàng: `store/thumbnail_1024.png`, `store/thumbnail_628.png` (tạo lại: `bun tools/art/thumbnail.ts store/thumbnail_1024.png 1024`).
- Kiểm thứ tự sự kiện SDK bằng SDK giả: `npm run build && node tools/poki-events.mjs dist/poki`.

## Ghi chú kỹ thuật

- `maxTextures: 1` trong `src/main.ts`: tắt gộp nhiều texture một lượt vẽ, vì sprite xoay bị mất một tam giác
  khi nhiều texture chung batch (thấy trên SwiftShader). Cần đo FPS trên điện thoại thật; nếu ổn thì giữ.
- Sự kiện Poki: `gameplayStart` ở lần chạm đầu; mở menu/pause/kết quả boss gửi `gameplayStop`, quay lại chơi gửi `commercialBreak` rồi `gameplayStart`. Không có bộ đếm quảng cáo riêng.
- Góc trên trái để trống cho nút Poki trên điện thoại.
