# Game #3 — Kitty Pond: Hatch & Fish (v1.15)

Tên cũ "Pond Pals: Hatch & Fish" đã đổi ở v1.13 vì trùng tên game của HyperBeard. Tên file tài liệu và khóa lưu tiến trình (`pondpals`) giữ nguyên.

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
bun tools/formtune.ts  # tỉ lệ thắng 4 dạng boss khi đấu lại
npm run audio          # tạo lại âm thanh (cần python3, numpy, scipy, ffmpeg); chỉ nhạc: python3 tools/make_audio.py music
```

Trên bản web có preset để chụp màn hình: `#dev-rich` (đủ xu, sẵn boss), `#dev-misty` (hồ 2), `#dev-frozen` (hồ 3). Đổi ngôn ngữ để thử: `?lang=de` (en, fr, it, de, es, tr). Thử tốc độ game: `?speed=0.7` (0–2; mặc định máy tính 0,9 (v1.16; v1.15 là 0,85), điện thoại 0,75, đặt ở `GAME_SPEED_DESKTOP` và `GAME_SPEED_PHONE` trong `src/content/data.ts`). `bun tools/bosstest.ts` nhận `SPEED=0.75` để mô phỏng boss trên điện thoại.

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
- Thumbnail cửa hàng: `store/thumbnail_1024.png`, `store/thumbnail_628.png` (tạo lại: `bun tools/art/thumbnail.ts store/thumbnail_1024.png 1024`). 3 ảnh chơi dọc 1080×1920 cho form nộp: `store/screenshots/`.
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
- `builds/` (không đưa lên git): bản build Poki `KittyPond_Poki_vX.zip` và file thử trên điện thoại `KittyPond_PhoneTest_vX.html` (trước v1.13: `PondPals_…`) của bản mới nhất; các bản cũ nằm trong `builds/old/`.
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
- v1.12: sửa lỗi theo đánh giá nộp Poki (chặn cuộn trang, ESC pause mọi lúc, âm thanh tải sau khi vào game, thông báo không chồng nhau); boss đầu hồi 10%; 4 dạng boss khi đấu lại (Cuồng nộ, Ma, Khổng lồ, Vàng); sự kiện phễu `PokiSDK.measure`; hồ sơ nộp Poki `docs/Poki-Nop-Game.md`.
- v1.13: đổi tên thành Kitty Pond: Hatch & Fish; chạy lại toàn bộ test trước khi nộp.
- v1.14: theo trang "What we look for" của Poki: thumbnail mới (mèo là nhân vật chính), 3 ảnh chơi cho form; tải hình theo lượt (hồ đang chơi trước, phần còn lại tải nền); điều khiển menu bằng phím (mũi tên/WASD, Tab, Enter/Space, ESC); thú giúp hiện chữ khi có tác dụng; nhạc riêng 3 hồ (2–2,5 phút); gom nút bên trái vào nút "…". Cá TRUY NÃ xuất hiện theo thời gian chơi (lần đầu sau 4 phút, sau đó 3–5 phút một lần), bơi ở chỗ ngẫu nhiên 75 s, khó kéo hơn cá thường, giá ×4. Boss đấu lại máu ×1,3.
- v1.15 (28–29/10, tài khoản B, chưa build bản Poki vì máy và cloud không chạy được npm; bản thử `builds/KittyPond_PhoneTest_v1.15-thu.html`):
  - Tốc độ: mọi chuyển động chạy theo `GAME_SPEED`, máy tính 0,85, điện thoại và máy tính bảng 0,75 (nhận theo `pointer: coarse`). Bước thời gian giới hạn 0,25 s, câu cá chia bước nhỏ tối đa 1/30 s, nên máy tính chậm không còn bị chậm game. `QualityGovernor` và độ phân giải đã lưu dùng cho mọi máy, không chỉ điện thoại.
  - Boss: lúc đầu trận boss đứng yên tới lần chạm đầu, sau đó 1 s êm; hồi máu chỉ sau khoảng êm. Hồ 1 máu ×0,68, lực ×1,05; hồ 2 máu ×0,92, lực ×0,97; hồ 3 giữ nguyên (chỉ trận đầu). Mô phỏng 60 fps, máy tính: hồ 1 thắng 93/89/93%, 19–22 s; hồ 2 76/81/89%, 26–29 s; hồ 3 64/70/69%. Điện thoại (0,75): hồ 1 95/92/95%, 21–25 s; hồ 2 79/86/93%, 30–33 s; hồ 3 65/75/78%.
  - Boss thua có hai thông báo riêng: chạy mất (thanh hồi đầy, chờ 0,7 s cho người chơi thấy) và đứt dây. Thêm chỉ báo độ mòn dây 5 vạch dưới thanh căng.
  - Trứng: giá bán 25/70/150/350/800 (×hệ số hồ), tỉ lệ ra trứng 70/18,5/7,5/2,5/1,5%. Mô phỏng kinh tế: xu sau 60 phút tăng khoảng 24–47%, tới hồ 3 sớm khoảng 6–8 phút so với v1.14. Thời gian nở hiển thị đã tính buff của rùa.
  - Màn dọc: nút giỏ trứng gọn một nút (trứng, giờ nở, chấm ô lò, số trứng trong giỏ), bảng trứng mở ra từ nút đó; thú không bị che.
  - Art: ếch bản 3; vịt, rái cá, rùa, kỳ giông và các thú còn lại bản 4; hải ly và thỏ giữ bản 1; Mist Fawn thành hươu cao cổ chibi (Mist Giraffe, đổi tên 6 ngôn ngữ); mèo kiểu C2 (`src/render/catArt.ts`). Phần trên bờ ba hồ vẽ lại (`src/render/shore.ts`): hồ 1 đồng cỏ, nhà, cây; hồ 2 núi sương, cầu đá, liễu; hồ 3 vách đá, tuyết trên đỉnh, thác đóng băng, nhà gỗ. Hiệu ứng nhẹ: chim, bướm, khói ống khói. Phần dưới nước giữ v1.14. Test mới `src/logic/art.test.ts` chặn thuộc tính SVG lặp (lỗi đó từng làm mất hình con diệc).
  - Kiểm tra: tsc sạch, 32 test bun + 10 test core đạt. Kiểm bằng file tạm thay cho `npm run typecheck` (tsc toàn cục với khai báo Phaser giả) và build bằng `tools/bun-build.mjs` với Phaser lấy từ bản v1.14.
- v1.16 (29/10, tài khoản B, chưa build bản Poki vì máy và cloud không chạy được npm; bản thử `builds/KittyPond_v1.16-thu_reset.html` ở thư mục gốc GameMaking, tự reset tiến độ khi mở lần đầu):
  - Pet: cân bằng lại buff (`PERKS` 5 mức độ hiếm; cấp 20 nhân `PET_TOP_MULT` 2,8 ở Common xuống 2,0 ở Legendary, để pet hồ đầu không mất giá trị quá nhanh), thêm 3 buff `finder`, `treasure`, `big`. Trứng hồ 2 có 30% nở pet hồ 1; trứng hồ 3 có 10% pet hồ 1 và 20% pet hồ 2 (`EGG_POND_MIX`, bỏ qua pet đã cấp tối đa); trứng có dấu hồ ở góc.
  - Câu: mỗi loài cá có chỗ ở theo độ xa (`FishDef.zone`, ×2,5 ở vùng ưa thích, chuẩn hoá theo độ hiếm nên kinh tế gần như không đổi). Cá Huyền thoại chỉ hiện 15 s trong vùng của nó (`LEGEND`), phải ném trong 120 đơn vị mới câu được. Điện thoại dọc: ba vùng ném thành ba tầng nước (lưỡi chìm 14/37/60% độ sâu, cá bơi trong tầng vùng mình); khi giữ ném, vùng sẽ rơi vào sáng lên (`Pond.setAim`). Móc chắc 5 phút: tuột 20% xuống 10%, giá 30% xu, tối thiểu 100/500/2.000 theo hồ đã mở (`FIRM_HOOK`). Máy tính tốc độ 0,85 lên 0,9.
  - Thử thách: màn 1–2 giữ nguyên; từ màn 3 thêm 1 loài và một đàn cá Thường bơi khắp hồ, 7/9/10/12/13/15 con ở màn 3–8. Ô theo dõi loài đã bắt (ảnh cá nhỏ riêng `fishs:<id>` cho nét). Chỉ mở sau khi bắt boss của hồ đó. Thông báo thưởng ghi rõ lần đầu, kỷ lục hay chơi lại.
  - Tủ đồ: mỗi món cộng 1–3% chỉ số (`CosmeticDef.stats`, món đắt cộng nhiều hơn); bảng cuộn 4 cột (kéo, lăn chuột, phím, thanh cuộn); nút phóng to và xác nhận khi mua (nút Huỷ được chọn sẵn khi dùng phím). ESC chỉ đóng bảng trên cùng; khung chọn phím ẩn khi cuộn.
  - HUD: cột nút trái dời lên nhưng nằm dưới vùng nút Poki (kể cả điện thoại xoay ngang, trước đây bị lấn); lời nhắc BOSS nằm dưới nút, ngón tay ở góc nút.
  - Âm thanh: tiếng `crack` mới (trứng nứt 3 lần khi lắc, vết nứt dài dần), `hatch` làm lại (tiếng vỡ giòn, vỏ vụn, rồi chuông); `python3 tools/make_audio.py eggs`, dòng ngẫu nhiên riêng nên các tiếng khác giữ nguyên byte.
  - Đánh giá: `docs/KittyPond-DanhGia-Poki-CrazyGames-v1.16.md` (đối chiếu tiêu chí) và `docs/KittyPond-DanhGia-TongThe-v1.16.md` (nội dung, thiết kế, độ thu hút, việc cần làm trước khi nộp).
  - Kiểm tra: tsc sạch (khai báo Phaser giả), 41 test bun đạt; chụp màn hình Playwright ở 412×755, 360×640, 755×412, 1031×580. Mô phỏng kinh tế 60 lượt mỗi kiểu (máy tính): boss hồ 1 phút 2,4–3,0, hồ 2 phút 11–16, hồ 3 phút 27–42. Người dùng chơi thử Android: ổn, chỉ góp ý vùng ném ở màn dọc (đã sửa).
