# Kitty Pond: Hatch & Fish — đánh giá tổng thể bản v1.16 và đường nộp Poki → CrazyGames

Ngày 29/10/2026, bản v1.16 chưa commit (trên `main` `897072c` + mọi thay đổi của phiên 29/10, tài khoản B, tới bản thử v1.16m). Bản này thay cho bản đánh giá sáng cùng ngày (`KittyPond-DanhGia-Poki-CrazyGames-v1.16.md`), thêm phần nội dung, thiết kế, chiều sâu và độ thu hút, và cập nhật các thay đổi buổi chiều (tủ đồ cuộn và xem phóng to, xác nhận khi mua, móc chắc 5 phút, theo dõi loài trong thử thách, thử thách mở sau boss, đàn cá gây nhiễu 7–15 con).

Cách đọc: **Sự thật** là điều đọc được từ trang chính thức của Poki/CrazyGames (đọc lại ngày 29/10, nguồn ở cuối), từ code, test hoặc mô phỏng chạy ngày 29/10. **Ý kiến** là đánh giá của Claude, chưa có số liệu người chơi thật nào. Poki và CrazyGames không công bố tỉ lệ duyệt.

## 1. Kết luận ngắn

- **Game đã đủ nội dung và chiều sâu để nộp Poki** (ý kiến). Điểm mạnh nhất: vào chơi ngay, phần thưởng rất dày trong 3 phút đầu, có boss ở phút 2–3, và có nhiều hệ thống dài hơi (pet cấp 20, đấu lại boss 10 sao, 24 thử thách, huy chương, tủ đồ).
- **Chưa nộp được ngay.** Còn 5 việc chặn (mục 6.1): build Poki thật bằng npm và chạy lại toàn bộ kiểm tra; vẽ lại thumbnail và ảnh chơi theo art hiện tại; chơi thử trên điện thoại thật và Poki Inspector; viết trang khai báo dùng AI; cho 3–5 người thật chơi thử.
- **Rủi ro lớn nhất không nằm ở kỹ thuật** mà ở 3 chỗ: thumbnail (quyết định Web Fit Test), câu hỏi "game làm chủ yếu bằng công cụ AI" ở Final review, và việc chưa có người thật nào chơi các bản v1.15–v1.16.
- **CrazyGames là đường lui hợp lý** nếu Poki không nhận. Phải làm thêm khoảng 1–2 phiên: adapter SDK, dời 2 nút quảng cáo có thưởng khỏi màn chơi, thêm cách lấy thưởng bằng xu, ảnh bìa và video (mục 5).

**Ước lượng khả năng (ý kiến):**

| Bước | Hiện tại | Sau khi làm đủ mục 6.1–6.2 |
| --- | --- | --- |
| Poki: kiểm duyệt nội dung khi upload | khoảng 90% | khoảng 90–95% |
| Poki: Player Fit Test | khoảng 65–75% | khoảng 75–85% |
| Poki: Web Fit Test | khoảng 40–50% | khoảng 50–60% |
| Poki: Final review | khoảng 35–50% | khoảng 45–55% |
| **Poki: tổng tới phát hành** | **khoảng 15–25%** | **khoảng 25–35%** |
| CrazyGames: qua QA vào Basic Launch | khoảng 50–60% | khoảng 65–75% |
| CrazyGames: Basic Launch lên Full Launch | khoảng 35–45% | khoảng 40–50% |

Không có cách nào làm "chắc chắn" được duyệt. Poki chọn rất ít game, và bước cuối là đánh giá chủ quan của họ. Các việc ở mục 6 chỉ gỡ những lý do từ chối có thể đoán trước.

## 2. Nội dung hiện có (sự thật, đếm từ code)

| Mảng | Số lượng | Ghi chú |
| --- | --- | --- |
| Hồ | 3 (Cozy Pond, Misty Creek, Frozen Lake) | Mỗi hồ có cảnh, nhạc, boss riêng |
| Cá | 36 (12 mỗi hồ, 5 độ hiếm) | 3 chỗ ở theo độ xa (gần, giữa, xa); mỗi hồ có cá Huyền thoại hiện 15 giây |
| Boss | 3, mỗi con 10 sao đấu lại, 4 dạng | Boss giữ dây nhiều pha, mất máu khi bấm sai |
| Pet | 16 (5 mỗi hồ + 1 đặc biệt), cấp tối đa 20 | 9 loại buff; trứng hồ sau có thể nở pet hồ trước |
| Nâng cấp | 4 dòng (cần, dây, mồi, phao) | Cộng thêm móc chắc 5 phút (tỉ lệ tuột 20% xuống 10%) |
| Tủ đồ | 24 món (10 mũ, 5 cần, 4 phao, 5 mồi) | Mỗi món cộng 1–3% chỉ số; có xem phóng to và xác nhận khi mua |
| Thử thách | 24 (8 mỗi hồ) | Mở sau khi bắt boss hồ đó; từ màn 3 có đàn cá gây nhiễu 7–15 con |
| Hằng ngày | Quà 7 ngày, cá hôm nay (x5 xu + trứng đặc biệt), 3 vé đấu lại boss, 5 lượt chơi lại thử thách có thưởng | |
| Khác | Nhiệm vụ (6 loại), huy chương đồng/bạc/vàng cho từng cá, rương, câu tự động, ấp trứng khi offline | |
| Ngôn ngữ | 6 (Anh, Đức, Tây Ban Nha, Pháp, Ý, Thổ) | 396 câu chữ mỗi thứ tiếng; chưa người bản ngữ nào đọc |
| Code | Khoảng 12.000 dòng TypeScript, 41 bài test qua | |

## 3. Đánh giá thiết kế và chiều sâu (ý kiến)

### 3.1 Bảng điểm

| Mảng | Điểm /10 | Nhận xét chính |
| --- | --- | --- |
| Vòng chơi chính | 7,5 | Quăng, cắn câu, kéo dây: dễ hiểu sau 1 lần, một ngón tay. Kéo dây có giữ/thả theo màu nên có kỹ năng. Đơn điệu nhẹ sau 15–20 phút nếu không có mục tiêu mới, nhưng game luôn có mục tiêu kế tiếp |
| Nhịp thưởng 10 phút đầu | 8,5 | Mô phỏng: cá đầu ở giây 3–6, trứng ở giây 18, nâng cấp đầu ở giây 25–30, nở pet ở giây 50, boss ở phút 2,4–3. Khoảng trống dài nhất giữa hai phần thưởng lớn trong 3 phút đầu khoảng 27–29 giây |
| Tiến trình chính | 7,5 | Mở hồ 2 ở phút 11–16, hồ 3 ở phút 27–42, boss cuối ở phút 31–46 (mô phỏng ở tốc độ máy tính; trên điện thoại chậm hơn khoảng 20%). Đoạn phút 3 đến phút 11–16 chỉ có hồ 1, dựa vào pet, nâng cấp và cá hôm nay để giữ chân |
| Chiều sâu sau khi hết 3 hồ | 7,5 | Pet lên cấp 20, đấu lại boss 10 sao, 24 thử thách, huy chương vàng cho 36 cá, tủ đồ. Đủ cho người thích sưu tầm quay lại nhiều ngày. Phần lớn là "làm lại việc cũ khó hơn", chưa có hồ mới sau phút 45 |
| Độ rõ ràng, độ phức tạp | 6,5 | v1.16 thêm nhiều hệ thống (chỗ ở của cá, Huyền thoại, móc chắc, chỉ số tủ đồ, trứng hồ trộn, đàn cá gây nhiễu). Phần lớn mở sau hồ 2 nên 15 phút đầu vẫn gọn. Rủi ro: màn câu cá cuối game có nhiều nút và dòng chữ cùng lúc |
| Hình ảnh | 7 | Phong cách cozy thống nhất, mèo và pet vẽ lại ở v1.15 dễ thương. Vẽ bằng SVG trong code nên ít chi tiết và ít hiệu ứng hơn game có họa sĩ |
| Âm thanh | 6 | Nhạc riêng 3 hồ và hiệu ứng tổng hợp bằng code. Chưa ai nghe trên loa điện thoại thật |
| Độc đáo | 6,5 | Câu cá ghép với ấp trứng ra pet có buff, boss giữ dây, cá Huyền thoại 15 giây, thử thách ngắm giữa đàn cá. Chủ đề "mèo câu cá" thì đã có (Cat Goes Fishing, Whisker Waters); trên Poki mục Fishing có khoảng 9–10 game, nổi nhất là Tiny Fishing |
| Kỹ thuật | 7 | Bản v1.14 tải 2,2–3,6 MB, 4G 3,7 giây. **Chưa đo lại cho v1.15–v1.16**, chưa đo khung hình trên điện thoại thật |

### 3.2 Điểm mạnh

1. **Ấn tượng đầu tốt.** Không có màn chờ, chạm là chơi, tay chỉ hướng dẫn ngắn, cá đầu tiên trong vài giây. Đây đúng là điều Player Fit Test đo (thời gian chơi trong vài phút đầu).
2. **Luôn có mục tiêu kế tiếp hiện trên màn hình:** dải mục tiêu (bắt đủ X loài, gom xu mở hồ), nút BOSS, trứng đang ấp, cá hôm nay.
3. **Nhiều lý do quay lại ngày sau:** trứng ấp khi offline, quà 7 ngày, cá hôm nay, vé đấu lại boss mỗi ngày.
4. **Hợp khán giả rộng tuổi của Poki:** dễ thương, không bạo lực, không chữ dài.
5. **Kiếm tiền đúng chuẩn Poki:** chỉ quảng cáo Poki SDK, nút thưởng tự chọn, không mua bằng tiền thật, một loại tiền.

### 3.3 Điểm yếu và rủi ro thiết kế

1. **Đoạn giữa phút 3 và lúc mở hồ 2 (phút 11–16).** Sau trận boss đầu, game không mở hệ thống mới nào cho tới hồ 2. Nếu người chơi Poki rời đi ở đây, thời gian chơi trung bình vẫn qua mốc 3 phút, nhưng tỉ lệ quay lại ngày sau sẽ thấp. Nên xem lại khi có số liệu thật (sự kiện `measure` đã có).
2. **Cuối game đông nút.** Cột trái 6 nút, dải trên có xu, may mắn, cá hôm nay, BOSS, chip móc chắc. Trên điện thoại 360 px đã vừa, nhưng trông bận.
3. **Thiếu nội dung "mới hẳn" sau phút 45.** Người chơi lâu sẽ chỉ còn cày sao boss và cấp pet. Đây không phải lý do để Poki từ chối, nhưng ảnh hưởng tới quay lại ngày 7. Hồ 4 (Coral Cove) đã có trong lộ trình.
4. **Cân bằng chưa thử với người thật.** Mọi con số (tỉ lệ tuột 20%, đàn cá gây nhiễu 15 con ở màn 8, giá móc chắc 30% xu) mới chỉ qua bot mô phỏng. Mô phỏng thô cho tỉ lệ qua màn 8 của thử thách khoảng 61–68% với người ngắm khá.
5. **Hai tốc độ chơi** (0,75 trên điện thoại, 0,9 trên máy tính) làm người chơi máy tính kiếm xu nhanh hơn khoảng 8–15%. Không ảnh hưởng duyệt.

## 4. Ước lượng độ thu hút người chơi (ý kiến)

Không có số liệu thật. Các con số dưới đây là đoán dựa trên nhịp thưởng đo bằng mô phỏng và mốc công khai của hai nền tảng. Nên coi chúng là giả thuyết để kiểm lại bằng Player Fit Test.

| Chỉ số | Mốc nền tảng (sự thật) | Ước lượng cho Kitty Pond |
| --- | --- | --- |
| Tỉ lệ người chơi quá 1 phút | CrazyGames: 80%+ | khoảng 80–90%: phút đầu đã có cá, trứng, nâng cấp, nở pet |
| Tỉ lệ lượt chơi quá 3 phút | Poki: từ 25% (mốc trong tài liệu dự án) | khoảng 35–50%: boss đầu rơi đúng phút 2,4–3 (máy tính) hoặc khoảng 3–3,6 (điện thoại) |
| Thời gian chơi trung bình | Poki: trên 3 phút; CrazyGames: 10+ phút | khoảng 6–12 phút |
| Quay lại ngày 1 | CrazyGames: 10–15% | khoảng 10–18%: có trứng ấp offline, quà ngày, cá hôm nay |
| Bấm vào từ thumbnail (CTR) | Poki so với game cùng thể loại | Chưa đoán được: thumbnail hiện tại vẽ theo art cũ, phải vẽ lại |

Người chơi hợp nhất (ý kiến): người thích game cozy, sưu tầm, idle nhẹ, chơi trên điện thoại vài phút mỗi lần. Ít hợp với người tìm game hành động hay nhiều người chơi.

## 5. Đối chiếu yêu cầu nộp

### 5.1 Poki (đường chính)

Quy trình Poki (sự thật): upload lên Poki for Developers, kiểm duyệt nội dung → Player Fit Test (người thật chơi, đo thời gian chơi) → Web Fit Test (thumbnail trên trang Poki, đo bấm vào và ở lại) → Final review (nhóm Poki xem chất lượng, độ hợp, độ độc đáo, cách làm) → phát hành mềm rồi toàn cầu.

| Yêu cầu | Trạng thái v1.16 | Việc còn lại |
| --- | --- | --- |
| Desktop, mobile, tablet; mobile phủ màn hình dọc và ngang | Đạt (chụp lại 29/10 ở 1031×580, 640×360, 412×755, 360×640) | Thử máy thật |
| Không gọi ra ngoài, không splash, không link ngoài | Đạt theo code | Chạy `check-build` trên build thật |
| Chặn quảng cáo vẫn chơi được, sự kiện SDK đúng | Đạt ở v1.14 | Chạy lại `tools/poki-events.mjs` và Poki Inspector trên build v1.16 |
| Tải nhanh, tải dần | Đạt ở v1.14 | **Đo lại**: v1.15–v1.16 thêm art pet mới, 15 hình trứng có dấu hồ, 36 ảnh cá nhỏ (tải sau) |
| ESC hoặc Space để pause; menu đi bằng phím | Đạt; v1.16 sửa khung chọn phím khi cuộn tủ đồ và ESC chỉ đóng bảng trên cùng | |
| Không UI ở vùng nút Poki góc trên trái (mobile) | Đạt sau khi sửa 29/10 | Kiểm trong Inspector |
| Quảng cáo đúng quy tắc (nút tím có 🎬, một video một phần thưởng) | Đạt | |
| Không IAP, một loại tiền, không chat/đăng nhập | Đạt | |
| **Thumbnail đúng với hình trong game** | **Chưa đạt** | Vẽ lại tĩnh (1024 và 628 px), 3 ảnh chơi, sau đó thumbnail động `.mp4` |
| **Khai báo AI** | **Chưa làm** | Poki cho dùng AI nhưng yêu cầu khai báo, và ở Final review có thể từ chối game "feel heavily tool-assisted or rapidly assembled" |
| Đa ngôn ngữ | Đạt một phần | Người bản ngữ đọc 5 bản dịch, nhất là các câu thêm ngày 29/10 |
| Nội dung an toàn | Đạt | Không máu, không cờ bạc tiền thật; trứng và rương chỉ dùng xu trong game |

### 5.2 CrazyGames (đường lui nếu Poki không nhận)

Game đi đường A (độc quyền web với Poki), nên chỉ nộp CrazyGames sau khi Poki trả lời không nhận.

| Yêu cầu | Trạng thái | Việc cần làm |
| --- | --- | --- |
| Tải đầu ≤ 50 MB (≤ 20 MB để lên trang chủ mobile), vào chơi trong 20 giây | Đạt | |
| Chạy tốt trên Safari/iPhone (nếu không sẽ bị tắt trên Safari) | Chưa kiểm | Thử iPhone thật |
| Chữ đọc được ở 10 khung cửa sổ của họ (800×450 tới 1920×1080) | Gần như chắc đạt | Chụp đủ 10 khung |
| SDK CrazyGames, `gameplayStart/Stop`, lưu tiến trình qua Data module, lấy ngôn ngữ từ SDK | Chưa làm cho game #3 | Có sẵn adapter từ game #1 (`core/platform/crazygames.ts`); cần build mode `crazygames` |
| **Nút quảng cáo có thưởng không nằm trên màn đang chơi** | **Không đạt** | Dời nút mồi vàng và trứng bí ẩn vào một bảng (ví dụ bảng Quests hoặc bảng quà) |
| **Có cách lấy thưởng không cần quảng cáo** | **Không đạt** | Cho mua mồi vàng và trứng bí ẩn bằng xu |
| Tránh dùng ESC (thoát toàn màn hình) | Nên sửa | Pause bằng P và nút trên màn cho bản CrazyGames |
| Ảnh bìa 1920×1080, 800×1200, 800×800 và video 16:9, 2:3 (15–20 giây) | Chưa có | Làm cùng lúc với thumbnail Poki |
| Chất lượng tổng thể | Rủi ro trung bình | Game #1 bị từ chối 19/10 vì "overall quality". Game #3 hoàn thiện hơn nhiều (3 hồ, nhạc, art vẽ lại, pet, boss), nhưng cùng cách vẽ bằng code |

## 6. Việc cần làm để tăng khả năng được duyệt, theo thứ tự

### 6.1 Chặn: phải xong trước khi tạo game trên Poki for Developers

1. **Build thật trên máy có npm:** `npm install`, `npm run typecheck`, `npm test`, `npm run build`. Bản thử hiện tại dựng tạm bằng bun và có lỗi console "phaser-extracted"; bản thật thì không có lỗi này.
2. **Chạy lại bộ kiểm v1.14 trên build mới:** `check-build`, `tools/poki-events.mjs`, chặn quảng cáo, chế độ ẩn danh, cuộn trang, 3 khung desktop, điện thoại dọc và ngang, thời gian tải trên 4G/3G.
3. **Vẽ lại thumbnail và ảnh chơi theo art hiện tại.** Thumbnail quyết định Web Fit Test. Gợi ý: mèo áo mưa vàng to ở giữa đang giật cá Huyền thoại phát sáng, một pet bên cạnh, nền hồ xanh, không chữ. Nên làm 2–3 phương án để chọn.
4. **Chơi trên điện thoại thật 20 phút và chạy Poki Inspector:** khung hình, nóng máy, âm thanh qua loa, cảm giác tốc độ 0,75, thử thách màn 3 trở lên, tủ đồ cuộn.
5. **Trang khai báo cách làm game (tiếng Anh, khoảng 1 trang):** dùng Claude viết code, vẽ art SVG, làm nhạc; bạn quyết định thiết kế, duyệt từng bản art, cân bằng, chơi thử, yêu cầu sửa qua 16 phiên bản; có lịch sử git và tài liệu thiết kế. Khai báo trung thực ở mục công cụ khi nộp.

### 6.2 Nên làm trước Player Fit Test: tăng khả năng qua

6. **Cho 3–5 người thật chưa biết game chơi 10 phút**, không hướng dẫn. Ghi lại: chỗ họ lúng túng, phút họ muốn dừng, họ có hiểu bước kéo dây và ấp trứng không. Đây là cách duy nhất kiểm các giả thuyết ở mục 4 trước khi Poki đo.
7. **Lấp đoạn giữa phút 3 và lúc mở hồ 2:** ví dụ cho xem trước hồ 2 trên bản đồ kèm thanh tiến độ rõ hơn, hoặc mở huy chương sớm hơn. Chỉ làm nếu bước 6 cho thấy người chơi rời đi ở đoạn này.
8. **Người bản ngữ đọc 5 bản dịch.** Câu dịch sai làm mất điểm "chất lượng" ở cả hai nền tảng.
9. **Cập nhật mô tả game** trong `Poki-Nop-Game.md` cho v1.16 (Huyền thoại, chỗ ở của cá, buff mới, trứng hồ trộn, tủ đồ có chỉ số, thử thách đàn cá).

### 6.3 Trước khi Poki phát hành toàn cầu

10. Thumbnail động `.mp4` 1080×1080, từ 50 khung/giây, 4–6 giây.

### 6.4 Chỉ khi chuyển sang CrazyGames

11. Build mode `crazygames` với Data module, ngôn ngữ từ SDK, `gameplayStart/Stop`.
12. Dời nút mồi vàng và trứng bí ẩn khỏi màn câu cá; thêm giá bằng xu; pause bằng P.
13. Ảnh bìa 3 cỡ, 2 video; thử Safari/iPhone, Chromebook và 10 khung cửa sổ.

## 7. Những gì chưa kiểm được trong phiên này

- Tốc độ tải và dung lượng của build thật v1.16: npm bị chặn trong máy ảo và trên máy chủ đám mây.
- Khung hình, nhiệt độ và âm thanh trên điện thoại thật.
- Phản ứng của người thật với các hệ thống v1.15–v1.16.
- Chất lượng 5 bản dịch.
- Trùng tên hoặc nhãn hiệu: tìm trên web chưa thấy game nào tên "Kitty Pond: Hatch & Fish", chưa tra cứu nhãn hiệu.

## Nguồn

- Poki: [What we look for](https://developers.poki.com/guide/what-we-look-for), [Requirements & quality](https://developers.poki.com/guide/requirements-quality), [Content & player safety](https://developers.poki.com/guide/content-player-safety), [Player fit test](https://developers.poki.com/guide/player-fit-test), [Web fit test](https://developers.poki.com/guide/web-fit-test), [Interpreting your test results](https://developers.poki.com/guide/reading-results), [Final review](https://developers.poki.com/guide/final-review), [Adding your game](https://developers.poki.com/guide/adding-your-game), [Poki: Fishing Games](https://poki.com/en/fishing)
- CrazyGames: [Requirements](https://docs.crazygames.com/requirements/intro/), [Technical](https://docs.crazygames.com/requirements/technical/), [Gameplay](https://docs.crazygames.com/requirements/gameplay/), [Ads](https://docs.crazygames.com/requirements/ads/), [Quality guidelines](https://docs.crazygames.com/requirements/quality/), [Basic Launch metrics](https://docs.crazygames.com/resources/basic-launch-metrics/), [CrazyGames: Fishing](https://www.crazygames.com/t/fishing)
- Trong dự án: mô phỏng kinh tế `tools/econ.ts` (60 lượt mỗi kiểu người chơi, chạy 29/10), mô phỏng thử thách, `docs/games/game1-clicker.md` (CrazyGames từ chối game #1, 19/10), `Game3_Fishing/docs/Poki-Huong-dan.md`, `Poki-Nop-Game.md`, `Pond-Pals-Tai-lieu-thiet-ke.md`, bản đánh giá sáng 29/10 `KittyPond-DanhGia-Poki-CrazyGames-v1.16.md`
