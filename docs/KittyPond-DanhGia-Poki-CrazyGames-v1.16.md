# Kitty Pond: đánh giá khả năng được duyệt trên Poki và CrazyGames (v1.16)

Ngày 29/10/2026, bản v1.16 chưa commit (trên `main` `897072c` + các thay đổi của phiên 29/10, tài khoản B). Đối chiếu với trang chính thức của Poki và CrazyGames đọc lại ngày 29/10 (nguồn ở cuối), tài liệu trên máy (`docs/project/06-yeu-cau-ky-thuat-portal.md`, `docs/WebGame-Publishing_Brief_v1.md`, `Game3_Fishing/docs/Poki-Huong-dan.md`, `Poki-Nop-Game.md`) và bản đánh giá cũ (v1.11–v1.14).

Ghi chú cách đọc: **Sự thật** là điều đọc được từ trang chính thức hoặc kiểm bằng máy. **Ý kiến** là đánh giá của Claude, không có số liệu người chơi thật. Hai nền tảng không công bố tỉ lệ duyệt.

## 1. Kết luận

- **Poki (đường A đã chọn): nên nộp, nhưng chưa nộp được ngay.** Phần lớn yêu cầu bắt buộc đã đạt từ v1.14. Có 4 việc chặn trước khi nộp (mục 4): build Poki thật của v1.16 và chạy lại toàn bộ kiểm tra; vẽ lại thumbnail và ảnh chơi theo art v1.15; thử trên điện thoại thật và Poki Inspector; chuẩn bị phần khai báo dùng AI.
- **CrazyGames: chỉ là đường lui nếu Poki không nhận.** Game đi đường A (độc quyền web), nên không đăng CrazyGames khi Poki còn đang xét. Nếu phải chuyển sang, cần thêm adapter CrazyGames, 3 ảnh bìa và 2 video, và sửa 3 điểm về nút quảng cáo có thưởng và phím ESC (mục 3).

**Ước lượng (ý kiến):**

| Bước | Khả năng | Lý do chính |
| --- | --- | --- |
| Poki: kiểm duyệt nội dung khi upload | Cao (khoảng 90%) | Nội dung cozy, không bạo lực, không IP người khác, một loại tiền, không IAP |
| Poki: Player Fit Test (trung bình > 3 phút và ≥ 25% lượt > 3 phút) | Khá (khoảng 70–80%) | Cá đầu tiên sau khoảng 3 giây, nở pet trước phút 1, boss đầu ở phút 2,3–3,3 (mô phỏng v1.16), mốc thưởng dày. Rủi ro: v1.15–v1.16 đổi nhiều thứ chưa có người thật chơi |
| Poki: Web Fit Test (CTR, thời gian trên trang, C2P so với thể loại) | Chưa đoán được (khoảng 50%) | Phụ thuộc thumbnail mới (chưa vẽ) và tốc độ tải trên máy thật (chưa đo cho v1.15+) |
| Poki: Final review | Trung bình (khoảng 35–50%) | Chiều sâu tốt; rủi ro ở thể loại câu cá đã có 9–10 game, và câu hỏi "game làm chủ yếu bằng công cụ AI" |
| Poki: tổng cộng tới phát hành | Khoảng 20–30% | Tích các bước trên; Poki chọn rất ít game mỗi ngày |
| CrazyGames: qua QA vào Basic Launch | Khoảng 55–65% | Kỹ thuật đạt; game #1 (cùng cách vẽ bằng code) bị từ chối vì "overall quality"; game #3 hoàn thiện hơn nhiều (3 hồ, nhạc, art vẽ lại, pet, boss) |
| CrazyGames: từ Basic Launch lên Full Launch | Khoảng 40–50% | Mốc của CrazyGames: thời gian chơi trung bình 10+ phút, ngày 1 quay lại 10–15%, 80%+ chơi quá 1 phút. Nội dung khoảng 45 phút và có nhiều lý do quay lại; chưa có số liệu thật |

## 2. Poki: đối chiếu từng tiêu chí

### 2.1 Yêu cầu bắt buộc và kỹ thuật (trang Requirements & quality)

| Yêu cầu | Trạng thái v1.16 | Ghi chú |
| --- | --- | --- |
| Chạy trên desktop, mobile, tablet; tablet dùng điều khiển cảm ứng | Đạt (kiểm ở v1.13–v1.14) | Gợi ý điều khiển chọn theo `pointer: coarse` |
| Mobile phủ kín màn hình, dọc hoặc ngang | Đạt | Hỗ trợ cả hai, dọc là chính |
| 16:9 co giãn ở 640×360, 836×470, 1031×580 | Đạt (chụp lại 29/10 ở 1031×580 và 640×360) | |
| Ẩn danh (localStorage trong try/catch) | Đạt | `core/storage.ts` |
| Không gọi ra ngoài | Đạt theo code | Chỉ script SDK `game-cdn.poki.com`; mọi hình vẽ bằng SVG trong code, âm thanh đóng gói. Cần chạy lại `check-build` trên bản build thật |
| Không splash, không link ngoài, chỉ quảng cáo của Poki SDK | Đạt | |
| Chặn quảng cáo vẫn chơi được | Đạt (v1.14) | Cần kiểm lại trên build v1.16 |
| Sự kiện SDK: `gameplayStart` ở lần chạm đầu, không trùng start/stop, `commercialBreak` khi quay lại chơi, không sự kiện lúc quảng cáo | Đạt (v1.14) | v1.16 thêm sự kiện `measure` `legend`; không đổi luồng start/stop. Kiểm lại bằng `tools/poki-events.mjs` |
| Build sạch | Đạt theo code | Preset dev, `?debug`, `?speed`, `?reset` chỉ có ở bản web. **Bản thử điện thoại hiện tại có lỗi console "phaser-extracted"** do cách dựng tạm (lấy Phaser từ bản cũ vì npm bị chặn); bản build Poki thật không có lỗi này, nhưng phải build bằng npm |
| Lưu tiến trình | Đạt | Tự lưu định kỳ, khi ẩn tab, khi đóng trang |
| Tải nhanh (người chơi bỏ đi nếu chờ quá 10 giây), tải dần | Đạt ở v1.14 (4G 3,7 s, 3G nhanh 6,1 s trên máy ảo) | **Chưa đo lại** sau khi v1.15 vẽ lại art và v1.16 thêm 15 hình trứng có dấu hồ. Trứng của hồ chưa mở tải sau |
| Cuộn trang không ảnh hưởng trang Poki | Đạt (v1.12) | |
| ESC hoặc Space để pause | Đạt (ESC mọi lúc từ v1.12) | |
| Cutscene bỏ qua được, hướng dẫn bằng hình | Đạt | Tay chỉ, câu 3–6 chữ |
| Không UI ở vùng nút Poki (góc trên trái trên mobile) | **Đạt sau khi sửa 29/10** | Cột nút trái v1.16 dời lên đã sát vùng nút ở điện thoại rộng 360 px; đặt lại để mép trên của nút ở 178 đơn vị, thấp hơn đáy vùng nút Poki (172 đơn vị ở điện thoại rộng 360 px). Phát hiện thêm: **ở điện thoại xoay ngang, nút đầu tiên nằm dưới vùng nút Poki từ trước tới nay**; đã dời xuống cho thiết bị cảm ứng (desktop giữ nguyên) |
| Quảng cáo: không tự đặt bộ đếm; nút thưởng tím, có 🎬, nút thường to bằng và ở trên; một video một phần thưởng; chặn quảng cáo thì không thưởng, không thông báo tự chế | Đạt (v1.2–v1.14, không đổi ở v1.16) | |
| Không IAP, không tiền thứ hai, không chat, không đăng nhập | Đạt | Một loại tiền (xu) |
| Thumbnail tĩnh và động | **Chưa đạt cho v1.16** | Thumbnail và 3 ảnh chơi vẽ theo art v1.14; mèo, pet và cảnh trên bờ đã vẽ lại ở v1.15, mà Poki yêu cầu thumbnail đúng với hình trong game. Thumbnail động `.mp4` (bắt buộc trước Global Release) chưa làm |
| Đa ngôn ngữ (khuyến nghị) | Đạt một phần | 6 thứ tiếng; chưa người bản ngữ nào đọc. Phiên 29/10 thêm 14 câu mới cho mỗi thứ tiếng (buff, chỗ ở của cá, Huyền thoại, thưởng thử thách) do Claude dịch |

### 2.2 "What we look for" (3 tín hiệu chính, 5 tín hiệu cộng thêm, không có điểm đậu)

| Tín hiệu | Đánh giá (ý kiến) |
| --- | --- |
| **Chất lượng** (UX, cảm giác, vòng chơi) | Khá. Vòng chơi quăng, cắn câu, kéo dây rõ; thưởng dày; có nhạc riêng 3 hồ. Điểm yếu: HUD dày ở cuối game; âm thanh và nhạc tổng hợp bằng code, chưa ai nghe trên điện thoại thật |
| **Hợp người chơi** | Khá. Cozy, mèo, sưu tầm pet hợp khán giả rộng tuổi của Poki. Chưa có video Playtest |
| **Kỹ thuật** | Khá ở v1.14 (2,2–3,6 MB, bộ nhớ ổn). Chưa đo khung hình trên điện thoại thật; chưa đo lại tải cho v1.15–v1.16 |
| **Độc đáo** | Trung bình đến khá. Trên trang Fishing của Poki có 9–10 game (Tiny Fishing là game nổi nhất, idle). Chưa thấy game nào ghép câu cá với ấp trứng ra pet có buff, boss giữ dây, cá Huyền thoại hiện lên 15 giây, chỗ ở của cá theo độ xa. Ở ngoài web có game câu cá với mèo (Whisker Waters, Cat Goes Fishing), nên chủ đề mèo câu cá không mới |
| **Chiều sâu, chơi lại** | Tốt. 3 hồ, 36 cá, 16 pet cấp 20, boss và 4 dạng đấu lại, 24 thử thách, huy chương, tủ đồ, cá hôm nay, quà 7 ngày |
| **Ấn tượng đầu** | Tốt về gameplay (vào chơi ngay, cá đầu tiên khoảng 3 s). Phụ thuộc thumbnail mới |
| **Cảm giác trên mọi thiết bị** | Tốt. Một ngón, Space, menu đi bằng phím |
| **Đất để lớn** | Tốt. Nội dung dựng từ dữ liệu; có lộ trình hồ 4 Coral Cove trong hồ sơ nộp |

### 2.3 Nội dung, an toàn, AI (trang Content & player safety, Reading results)

| Mục | Đánh giá |
| --- | --- |
| Nội dung cấm (bạo lực máu me, kinh dị kéo dài, tình dục, cờ bạc, rượu, thuốc lá) | Không có. Câu cá không có máu; boss là cá lớn. Rương và trứng cho thưởng ngẫu nhiên nhưng chỉ bằng xu trong game, không mua bằng tiền thật (sự thật về game; Poki không định nghĩa "gambling" chi tiết hơn) |
| Tên và IP | "Kitty Pond: Hatch & Fish": tìm trên web 29/10 chưa thấy game trùng tên (chưa tra cứu nhãn hiệu) |
| **AI** | **Rủi ro lớn nhất ở Final review.** Sự thật: Poki cho dùng AI ("AI should empower, not shortcut"), yêu cầu khai báo khi có art kiểu AI, chữ do AI viết hoặc code có LLM hỗ trợ, và có thể hỏi công cụ, quy trình. Ở Final review, Poki có thể từ chối game "feel heavily tool-assisted or rapidly assembled". Thực tế của game: toàn bộ code, hình (SVG vẽ bằng code), nhạc và hiệu ứng âm thanh do Claude làm theo chỉ đạo của bạn; bạn quyết định thiết kế, duyệt từng bản art, chơi thử và yêu cầu sửa. Phải khai báo trung thực. Có lợi: art có phong cách thống nhất, không watermark, không chữ prompt, có lịch sử git và tài liệu thiết kế dài thể hiện nhiều vòng chỉnh sửa |
| Trùng danh mục Poki | Rủi ro trung bình: Poki có thể hạn chế thể loại đông. Câu cá trên Poki chưa đông như các thể loại khác (9–10 game) |

## 3. CrazyGames: đối chiếu từng tiêu chí

| Yêu cầu | Trạng thái | Ghi chú |
| --- | --- | --- |
| Tải ban đầu ≤ 50 MB (≤ 20 MB để lên trang chủ mobile), tổng ≤ 250 MB, ≤ 1.500 file | Đạt | Bản build khoảng vài MB |
| Vào chơi được trong 20 giây; Chrome, Edge; Safari chạy tốt (nếu không sẽ bị tắt trên Safari) | Chưa kiểm Safari/iPhone | |
| `user-select: none`; âm thanh iOS gọi `resume()` trong thao tác chạm | Có trong bộ khung (từ game #1) | Kiểm lại trên iPhone |
| Chữ đọc được ở 907×510, 1216×684, 1077×606, 821×462, 1366×768, 1920×1080, 1536×864, 1280×720, 800×450, 1080×607 | Gần như chắc đạt (giao diện co giãn theo vùng an toàn 1280×720) | Chưa chụp đủ 10 khung |
| Tốc độ như nhau ở 144/165 Hz | Đạt (delta time, bước nhỏ 1/30 s) | |
| Có tiếng Anh; lấy ngôn ngữ từ SDK, không có thì tiếng Anh; bản dịch "accurate and high quality" | Đạt một phần | Cần người bản ngữ đọc 5 bản dịch |
| Không nút toàn màn hình tự làm, không link quảng bá, không link App Store | Đạt | |
| PEGI 12, khán giả 13+ | Đạt về nội dung | Ý kiến: hình mèo dễ thương có thể bị xếp là game cho trẻ em; CrazyGames tắt kiếm tiền ở kids.crazygames.com. Chưa rõ tiêu chí họ dùng để chuyển game sang đó |
| Full Launch: SDK, `gameplayStart/Stop`, lưu tiến trình qua Data module, người mới vào thẳng gameplay | Chưa làm cho game #3 | `core/platform/crazygames.ts` có sẵn từ game #1; cần build mode `crazygames` và kiểm |
| Ảnh bìa 1920×1080, 800×1200, 800×800 và video 16:9, 2:3 (15–20 s, không tiếng) | Chưa có | |
| **Nút quảng cáo có thưởng không được hiện trên màn đang chơi** | **Không đạt cho CrazyGames** | Nút mồi vàng và trứng bí ẩn (có 🎬) nằm ở cột trái ngay màn câu cá. Poki cho phép, CrazyGames thì không. Bản CrazyGames phải dời vào một bảng (ví dụ bảng Quests hoặc màn quà) |
| **Có cách lấy phần thưởng không cần quảng cáo** (ví dụ mua bằng xu) | **Không đạt cho CrazyGames** | Mồi vàng và trứng bí ẩn chỉ có qua quảng cáo |
| Tránh phím ESC (thoát toàn màn hình) | Hướng dẫn, không bắt buộc | Game dùng ESC để pause (Poki yêu cầu ESC hoặc Space). Bản CrazyGames nên pause bằng P hoặc nút trên màn |
| Bài học từ game #1 | | Game #1 bị từ chối 19/10: "The overall quality of the game does not yet meet the expectations of our platform". Ý kiến: game #3 khác game #1 ở chỗ có nhạc, art được duyệt từng bản, hướng dẫn ngắn bằng tay chỉ, 3 hồ nội dung; vẫn chung cách vẽ bằng code nên rủi ro "trông như prototype" chưa loại bỏ hẳn |

## 4. Việc cần làm, theo thứ tự

**Chặn, trước khi tạo game trên P4D**

1. Build Poki thật của v1.16 trên máy có npm: `npm install`, `npm run typecheck`, `npm test`, `npm run build`. Kiểm `check-build` (chỉ `game-cdn.poki.com`), dung lượng tải đầu, thời gian tới `gameLoadingFinished` trên 4G/3G.
2. Chạy lại bộ kiểm v1.14 trên build mới: sự kiện SDK (`tools/poki-events.mjs`), chặn quảng cáo, ẩn danh, cuộn trang, 3 khung desktop, điện thoại dọc và ngang.
3. Vẽ lại thumbnail tĩnh (1024 và 628 px, không chữ, mèo art v1.15 là nhân vật chính) và 3 ảnh chơi dọc 1080×1920 theo art mới.
4. Chơi trên điện thoại thật 15–20 phút: khung hình, nóng máy, cảm giác tốc độ 0,75, chỗ ở của cá, cá Huyền thoại 15 giây, thử thách màn 3+. Chạy Poki Inspector (QR test, Scaling Tests, chặn quảng cáo thật, Event Log, xử lý mọi cảnh báo).
5. Viết sẵn một trang ngắn (tiếng Anh) về quy trình làm game cùng AI: công cụ, việc bạn tự quyết định (thiết kế, duyệt art, cân bằng, chơi thử), số vòng chỉnh sửa, lịch sử git. Khai báo đúng ở mục engine/công cụ khi nộp.

**Nên làm trước Player Fit Test**

6. Nhờ người bản ngữ đọc 5 bản dịch, ưu tiên các câu mới thêm ngày 29/10.
7. Cập nhật mô tả trong `Poki-Nop-Game.md` cho v1.16 (Huyền thoại 15 giây, chỗ ở của cá, ba buff mới, trứng hồ cũ).

**Trước Global Release (Poki)**

8. Thumbnail động `.mp4` 1080×1080, ≥ 50 fps, 4–6 s.

**Chỉ khi chuyển sang CrazyGames**

9. Build mode `crazygames`, Data module lưu tiến trình, lấy ngôn ngữ từ SDK.
10. Dời nút mồi vàng và trứng bí ẩn ra khỏi màn câu cá; thêm cách mua bằng xu; pause bằng P.
11. Ảnh bìa 3 cỡ và 2 video; thử Safari/iPhone và Chromebook.

## Nguồn

- Poki: [What we look for](https://developers.poki.com/guide/what-we-look-for), [Requirements & quality](https://developers.poki.com/guide/requirements-quality), [Content & player safety](https://developers.poki.com/guide/content-player-safety), [Player fit test](https://developers.poki.com/guide/player-fit-test), [Web fit test](https://developers.poki.com/guide/web-fit-test), [Interpreting your test results](https://developers.poki.com/guide/reading-results), [Final review](https://developers.poki.com/guide/final-review), [Adding your game](https://developers.poki.com/guide/adding-your-game), [Poki: Fishing Games](https://poki.com/en/fishing)
- CrazyGames: [Requirements](https://docs.crazygames.com/requirements/intro/), [Technical](https://docs.crazygames.com/requirements/technical/), [Gameplay](https://docs.crazygames.com/requirements/gameplay/), [Ads](https://docs.crazygames.com/requirements/ads/), [Quality guidelines](https://docs.crazygames.com/requirements/quality/), [Basic Launch metrics](https://docs.crazygames.com/resources/basic-launch-metrics/), [CrazyGames: Fishing](https://www.crazygames.com/t/fishing)
- Trong dự án: `docs/games/game1-clicker.md` (CrazyGames từ chối game #1, 19/10), `Game3_Fishing/docs/Poki-Huong-dan.md`, `Game3_Fishing/docs/Poki-Nop-Game.md`, bản đánh giá v1.11–v1.14 (project claude.ai, `claude/PondPals-DanhGia-Poki-v1.11.md`)
