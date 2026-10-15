# Game #3 — Pond Pals: Hatch & Fish (v1.11)

Game câu cá thư giãn một chạm, ấp trứng ra thú cưng giúp câu. Đường phát hành A: Poki (độc quyền web).
Tài liệu thiết kế: `docs/Pond-Pals-Tai-lieu-thiet-ke.md`. Báo cáo kinh tế, nhịp chơi và giữ chân: `docs/PondPals-BaoCao-KinhTe-v1.3.md` (mục 8: v1.4, mục 9: v1.5, mục 10: v1.6, mục 11: phương án D3/D7, mục 12: v1.8).

## Chạy

```
npm install
npm run dev            # chơi thử trên máy, mở http://localhost:5173
npm run build          # bản Poki (SDK v2) -> dist/poki, kèm kiểm tra dung lượng
npm run build:single   # một file HTML để thử trên điện thoại
npm test               # test khung chung + luật game
npm run sim            # mô phỏng cân bằng 1 giờ chơi
bun tools/econ.ts 150  # mô phỏng 3 kiểu người chơi: mốc tiến trình, thưởng, thao tác mỗi phút
bun tools/bosstest.ts  # tỉ lệ thắng boss lần đầu và thời lượng trận
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

## Thư mục trên máy và GitHub

- Thư mục làm việc: `D:\Projects\GameMaking\Game3_Fishing` chính là repo git này (nhánh `main`).
- Remote: `origin` = https://github.com/anhtu000/3Fishing.git. **Chưa push**: khi tài khoản GitHub đúng đã đăng nhập trên máy, chạy:

  ```
  git push -u origin main
  ```

  Sau đó lấy code mới về bằng `git pull`.
- `builds/` (không đưa lên git): bản build Poki `PondPals_Poki_vX.zip` và file thử trên điện thoại `PondPals_PhoneTest_vX.html` của bản mới nhất; các bản cũ nằm trong `builds/old/`.
- Báo cáo kinh tế, nhịp chơi và giữ chân: `docs/PondPals-BaoCao-KinhTe-v1.3.md`. Hướng dẫn Poki: `docs/Poki-Huong-dan.md`. Thiết kế: `docs/Pond-Pals-Tai-lieu-thiet-ke.md`.

## Lịch sử phiên bản

- v1.0: game gốc (2 hồ, đồ họa SVG tự vẽ, ấp trứng, thú, boss).
- v1.1: sửa theo quy định Poki (sự kiện SDK, không hẹn giờ quảng cáo, nút thưởng tím có biểu tượng phim, một loại tiền, ESC tạm dừng), thumbnail.
- v1.2: hồ 3 Frozen Lake, 6 ngôn ngữ, bảng cài đặt chọn ngôn ngữ.
- v1.3: phút đầu dễ hơn, cá TRUY NÃ, chuỗi hoàn hảo, thanh mục tiêu, boss có cảnh báo "LET GO!" và dây mòn, chỉnh giá mở hồ.
- v1.4: cá hôm nay, tổ trứng qua đêm, quà ngày và nhiệm vụ nhân theo hồ, nhiệm vụ thứ 3 tặng trứng, offline tối đa 8 giờ.
- v1.5: giỏ trứng, cá hôm nay một con cho cả game mỗi ngày, cảnh vật riêng cho từng hồ.
- v1.6: ô lò ấp 10k/40k/150k, bỏ quảng cáo nhận trứng (chỉ còn "Nở ngay"), thú tối đa cấp 20, trứng ra nhiều hơn 20%.
- v1.7: auto fishing chậm lại và trượt 30%.
- v1.8: đấu lại boss có sao (vé hằng ngày), huy chương sưu tập và hồ vàng, tủ đồ (mũ, cần, phao), mũ ngày 3 và Rùa cầu vồng ngày 7.
- v1.9: chế độ Thử thách (24 màn, kỷ lục, sẵn chỗ cho bảng xếp hạng), 36 loài cá, cá tuột 20% khi kéo, boss hồi máu khi bấm sai và phải dụ lại sau khi thua, mồi câu trong tủ đồ, bán trứng trong giỏ, ô thú 4/5 giá 25k/150k, sắp chỗ thú 4–5.
- v1.10: giá trứng chỉ theo độ hiếm; hệ số giá 3 hồ ×1/×2/×4 (trước ×1/×3/×9); thưởng thử thách tăng đều 600–2.900; Frozen Lake 11.000; hạ giá các món cuối game.
- v1.11: art pet theo độ hiếm (hào quang, đá quý, tia sáng, lấp lánh); boss hồi 25% khi bấm trượt (ân hạn 0,25 s); nhãn sao boss rõ nghĩa (Fishdex hàng 10 sao, Wardrobe ★ n/15).
