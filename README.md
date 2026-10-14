# Game #3 — Pond Pals: Hatch & Fish (v1)

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

Trên bản web có preset để chụp màn hình: `#dev-rich` (đủ xu, sẵn boss), `#dev-misty` (đã mở hồ 2).

## Cấu trúc

- `core/` khung chung (đồng bộ từ game #1), thêm adapter Poki `core/platform/poki.ts`.
- `src/content/data.ts` nội dung: 2 hồ, 16 cá, 10 thú, 2 boss, nâng cấp, nhiệm vụ.
- `src/logic/` luật thuần TypeScript (giá, may mắn, trứng, thú, nhiệm vụ) và máy trạng thái câu cá; có test.
- `src/render/` toàn bộ hình vẽ SVG; `textures.ts` nạp thành texture lúc loading.
- `src/world/` cảnh hồ động (`Pond.ts`) và mèo + cần + dây + phao (`Rig.ts`).
- `src/ui/` bộ UI riêng của game (nút, bảng, HUD, thẻ bắt cá, nở trứng, các menu).
- `src/scenes/PlayScene.ts` ghép tất cả: vòng câu, hướng dẫn, boss, quảng cáo, thu offline.
- `tools/` build bằng Bun, chụp màn hình, bot chơi thử (`play.mjs`), sim, tạo âm thanh.

## Ghi chú kỹ thuật

- `maxTextures: 1` trong `src/main.ts`: tắt gộp nhiều texture một lượt vẽ, vì sprite xoay bị mất một tam giác
  khi nhiều texture chung batch (thấy trên SwiftShader). Cần đo FPS trên điện thoại thật; nếu ổn thì giữ.
- Quảng cáo xen kẽ chỉ ở chỗ nghỉ: đóng Sổ cá, sau boss, chuyển hồ. Không bao giờ lúc đang kéo.
- Góc trên trái để trống cho nút Poki trên điện thoại.
