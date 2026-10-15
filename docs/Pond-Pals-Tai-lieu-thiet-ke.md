# Game #3 — Pond Pals: Hatch & Fish — Tài liệu thiết kế

Ngày: 14/10/2026 · Bản gốc có thể chỉnh sửa: https://claude.ai/code/artifact/d79f1125-36b4-4d20-b33d-45a465f2efa8

## Tổng quan & định vị

Pond Pals là game câu cá thư giãn một chạm. Mỗi lần câu có thể ra trứng, ấp thành thú cưng, và thú cưng giúp câu tốt hơn. Game ghép hai ngách cầu cao, cung thấp: câu cá (27 game trên CrazyGames) và thú cưng (12 game).

| Hạng mục | Quyết định |
| --- | --- |
| Thể loại | Casual câu cá + sưu tầm, idle nhẹ |
| Người chơi mục tiêu | 10–35 tuổi, thị trường Tier 1, hay chơi khi đang nghe nhạc hoặc xem video |
| Độ dài phiên | 11–20 phút, chơi lại nhiều lần mỗi ngày |
| Nền tảng | Poki (đường A, độc quyền trên web, chọn 14/10); màn dọc là chính, vẫn chạy ngang trên desktop |
| Điều khiển | Một ngón hoặc chuột: giữ để thả, chạm để giật, giữ–nhả để kéo |
| Phong cách | Cozy pastel, không meme, không cơ chế "steal" |

Ba trụ cột thiết kế:

1. **Vui trong 10 giây.** Con cá đầu tiên lên trước khi có bất kỳ dòng hướng dẫn nào.
2. **Luôn có thứ đang chờ.** Lúc nào cũng có một quả trứng đang ấp, kéo người chơi câu thêm vài lần.
3. **Chơi được khi xao nhãng.** Thú cưng câu hộ khi người chơi rời tay, nên bỏ dở giữa chừng vẫn có tiến trình.

## Vòng chơi

Vòng 30 giây: **Thả, cắn, kéo → Vật bắt được → Bán cá lấy xu → Nâng cấp → câu khỏe hơn** (quay lại Thả).

Vòng trứng: **Vật bắt được → (trứng) Lò ấp trứng → (nở) Thú cưng**. Thú cưng trao perk (luck, giá bán, lực kéo) cho mỗi lần câu và câu hộ, kể cả khi offline.

Vòng meta 15 phút: **Bán cá → (loài mới) Sổ cá → (đủ 6/8) Boss của hồ → (thắng) Mở hồ mới**, giá cá ×3.

## Cơ chế câu cá

Một lần câu gồm ba nhịp, tổng cộng 5–12 giây, cả ba đều chỉ cần một ngón.

1. **Thả câu (giữ rồi nhả).** Thanh lực chạy lên xuống; nhả càng cao thì mồi rơi càng xa.
    - Gần: luck ×1 · Giữa: luck ×1,5 · Xa: luck ×2,5.
2. **Cắn câu (chạm đúng lúc).** Phao nhấp giả 1–3 lần, lần thật thì chìm hẳn.
    - Cửa sổ chạm 0,6 giây, nâng tối đa 0,9 giây nhờ cần câu và thú cưng.
    - Chạm sớm hoặc trễ: cá thoát, không mất gì, thả lại ngay.
3. **Kéo dây (giữ để kéo, nhả khi cá giật).** Thanh căng dây có vùng xanh ở giữa.
    - Giữ: căng tăng và cá lại gần. Nhả: căng giảm.
    - Nằm trong vùng đỏ quá 1 giây thì đứt dây.
    - Cá càng hiếm thì giật càng mạnh và vùng xanh càng hẹp.

**Vật bắt được** (tỉ lệ gốc, trước luck):

| Vật | Tỉ lệ | Kết quả |
| --- | --- | --- |
| Cá | 70% | Bán lấy xu, ghi vào Sổ cá |
| Trứng | 15% | Vào lò ấp; lò đầy thì đổi thành xu |
| Rác vui (ủng, lon) | 10% | Bán 1 xu, kèm câu thoại hài |
| Rương báu | 5% | Xu, đá quý hoặc vật trang trí hồ |

**Độ hiếm của cá và trứng:** Thường 60% · Khá 25% · Hiếm 10% · Sử thi 4% · Huyền thoại 1%. Mỗi 1% luck chuyển 1 điểm tỉ lệ từ bậc Thường sang các bậc trên, chia đều theo tỉ lệ của chúng.

**Tự câu** mở khóa ở hồ thứ 2. Bật lên thì game tự thả và kéo với hiệu suất 50% so với câu tay, hợp với người vừa chơi vừa xem video.

## Trứng và thú cưng

Trứng biến sự may rủi của mỗi lần câu thành mục tiêu dài hơi. Mỗi thú cưng nở ra làm vòng câu mạnh hơn, nên sưu tầm có ích chứ không chỉ để ngắm.

**Ấp trứng**

- Lò ấp bắt đầu 1 ô, nâng tối đa 4 ô.
- Thời gian ấp: Thường 30 giây · Khá 2 phút · Hiếm 5 phút · Sử thi 10 phút · Huyền thoại 20 phút.
- Mỗi con cá câu được rút 5 giây cho mọi trứng đang ấp, nên câu tay vẫn là cách nở nhanh nhất.
- Xem quảng cáo có thưởng: nở ngay một trứng.
- Độ hiếm của thú bằng độ hiếm của trứng. Trứng từ hồ nào nở ra thú của hồ đó.
- 1% cơ hội nở bản "lấp lánh" (đổi màu, không tăng chỉ số) để người chơi khoe.

**Thú cưng mang theo**

- 3 ô lúc đầu; ô thứ 4 mở ở hồ thứ 3, ô thứ 5 mua bằng đá quý.
- Mỗi thú có một perk; giá trị tăng theo độ hiếm.
- Thú trùng không merge (ngách merge đã bão hòa) mà thành "thức ăn": lên cấp tối đa 5, mỗi cấp +20% perk.
- Thú mang theo bơi hoặc chạy quanh hồ, phản ứng khi có cá cắn: đây là khoảnh khắc dễ thương người chơi hay chụp màn hình.

| Perk | Tác dụng | Thường | Huyền thoại |
| --- | --- | --- | --- |
| May mắn | Tăng luck | +2% | +15% |
| Thương nhân | Tăng giá bán cá | +5% | +40% |
| Lực sĩ | Kéo dây nhanh hơn | +5% | +35% |
| Tinh mắt | Cửa sổ chạm dài hơn | +0,05 giây | +0,3 giây |
| Thợ câu | Câu hộ, kể cả khi offline | 1 cá / 60 giây | 1 cá / 12 giây |
| Ấp ủ | Ấp trứng nhanh hơn | +5% | +40% |

## Kinh tế và công thức

Hai loại tiền, không có mua bằng tiền thật trong MVP. Mọi con số dưới đây là điểm xuất phát, sẽ chỉnh lại sau playtest.

- **Xu:** bán cá mà có; dùng để nâng cấp và mở hồ mới.
- **Đá quý:** từ rương, nhiệm vụ ngày, boss và quảng cáo; dùng mở ô thú, ô lò ấp và đồ trang trí hồ.

**Giá bán một con cá**

```
Price = B_rarity × S × P_pond × (1 + M)
```

- B (giá gốc theo độ hiếm): Thường 5 · Khá 12 · Hiếm 30 · Sử thi 80 · Huyền thoại 250 xu.
- S (kích thước): ngẫu nhiên 0,8–1,5, hiển thị bằng cm để người chơi so kỷ lục.
- P (hệ số hồ): hồ 1 ×1, mỗi hồ sau ×3 (×3, ×9, ×27, ×81).
- M: tổng perk Thương nhân của thú đang mang.

**Chi phí nâng cấp**

```
Cost(L) = C0 × 1.15^L
```

| Nâng cấp | Mỗi cấp | C₀ (xu) | Cấp tối đa |
| --- | --- | --- | --- |
| Cần câu | Lực kéo +8% | 20 | 50 |
| Dây câu | Chịu vùng đỏ lâu hơn +0,1 giây | 30 | 20 |
| Mồi | Luck +1% | 40 | 30 |
| Phao | Cửa sổ chạm +0,02 giây | 50 | 10 |

**Mục tiêu nhịp độ** để cân chỉnh: có một nâng cấp mua được sau mỗi 1–3 phút chơi; giá mở hồ kế tiếp bằng khoảng 15 phút thu nhập ở hồ hiện tại.

**Offline:** thú Thợ câu tiếp tục câu, tích tối đa 2 giờ (nâng lên 8 giờ bằng đá quý). Khi quay lại, xem quảng cáo để nhân đôi phần thu offline.

## Nội dung

Bản đầy đủ có 5 hồ, mỗi hồ 8 loài cá, 5 thú cưng và 1 boss; MVP chỉ làm 2 hồ đầu. Tên trong game dùng tiếng Anh vì thị trường chính là Tier 1.

**Quy tắc boss:** boss xuất hiện khi đã ghi 6/8 loài cá của hồ. Trận kéo dài 20–30 giây, 3 pha giật đổi nhịp. Thắng thì được một trứng Sử thi và quyền mở hồ kế (vẫn cần trả xu).

| Hồ | Chủ đề | Boss | Phạm vi |
| --- | --- | --- | --- |
| 1. Cozy Pond | Ao làng, hoa súng, nắng sáng | Old Whiskers (cá trê khổng lồ) | MVP |
| 2. Misty Creek | Suối rừng, sương sớm, đom đóm | The Fog Pike | MVP |
| 3. Coral Cove | Vịnh san hô nhiệt đới | Captain Clawford (cua đỏ) | Bản 1.2 |
| 4. Frozen Lake | Hồ băng, câu qua lỗ băng | Krampus Cod | Bản 1.1 (Giáng sinh) |
| 5. Moonlit Lagoon | Đầm đêm, cá phát sáng | The Moon Leviathan | Bản 1.3 |

**Cá của 2 hồ MVP**

| Độ hiếm | Cozy Pond | Misty Creek |
| --- | --- | --- |
| Thường | Pebble Minnow | Fog Shiner |
| Thường | Lily Carp | Stone Loach |
| Thường | Mud Guppy | Willow Dace |
| Khá | Bubble Perch | Mist Salmon |
| Khá | Clover Trout | Rainbow Grayling |
| Hiếm | Teacup Koi | Ghost Pike |
| Sử thi | Lantern Catfish | Thunder Sturgeon |
| Huyền thoại | Golden Duckfish | Silver Spirit Trout |

**Thú cưng của 2 hồ MVP**

| Độ hiếm | Cozy Pond | Misty Creek |
| --- | --- | --- |
| Thường | Puddle Frog · May mắn | Mossy Snail · Lực sĩ |
| Khá | Reed Duckling · Thương nhân | Creek Beaver · Thợ câu |
| Hiếm | Otter Pup · Thợ câu | Firefly Fox · May mắn |
| Sử thi | Lily Turtle · Ấp ủ | Heron Chick · Tinh mắt |
| Huyền thoại | Sunny Axolotl · Tinh mắt | Mist Fawn · Thương nhân |

Mỗi hồ còn có 2–3 món rác vui riêng (ủng cao su, lon soda, xe đạp cũ) để câu nào cũng có bất ngờ.

## Tiến trình và nhịp độ 15 phút đầu

Cứ 30–90 giây người chơi nhận một thứ mới, và hồ thứ hai mở quanh phút 15. Đây là đoạn CrazyGames và Poki dùng để đo playtime khi thử game, nên mọi khoảnh khắc đều được sắp sẵn.

1. **0:00** — Mở thẳng vào hồ, không menu. Ngón tay gợi ý "Giữ để thả".
2. **0:05** — Lần thả đầu chắc chắn có cá cắn sau 2 giây; cửa sổ chạm nới ra 1,2 giây.
3. **0:15** — Cá đầu tiên lên, tự bán, xu bay về góc màn hình.
4. **0:45** — Lần câu thứ 3 chắc chắn ra trứng; lò ấp xuất hiện.
5. **1:15** — Trứng nở ra Puddle Frog, được đặt sẵn vào ô mang theo.
6. **2:00** — Đủ xu cho lần nâng cần câu đầu tiên; nút nâng cấp sáng lên.
7. **3:00** — Hiện 3 nhiệm vụ ngày đầu tiên.
8. **5:00** — Rương báu đầu tiên (có sẵn), cho đá quý.
9. **8:00** — Sổ cá đạt 4/8, hiện bóng boss dưới nước làm mồi nhử.
10. **~12:00** — Đạt 6/8, đấu Old Whiskers.
11. **~15:00** — Mở Misty Creek và chế độ Tự câu.

**Giữ chân người chơi quay lại**

- 3 nhiệm vụ ngày, làm mới lúc 0:00 giờ địa phương.
- Chuỗi đăng nhập 7 ngày; ngày 7 tặng trứng Hiếm.
- "Lần câu may mắn" mỗi ngày: một lần thả với luck ×3.
- Phần thu offline chờ sẵn khi mở lại game.

## UI/UX màn hình dọc

Cả vùng hồ là nút câu: chạm đâu cũng được, nên không cần nhắm. Màn dọc là bố cục gốc vì Poki yêu cầu mọi game chạy được ở chế độ này.

**Bố cục từ trên xuống**

1. Thanh trên: xu, đá quý, nút cài đặt. Lò ấp nổi ở góc phải, hiện đồng hồ đếm ngược.
2. Hồ chiếm khoảng 60% màn hình; thú mang theo bơi hoặc ngồi quanh bờ.
3. Thanh lực và thanh căng dây hiện sát ngón tay, chỉ khi đang dùng.
4. Thanh dưới 4 nút: Nâng cấp · Thú cưng · Sổ cá · Bản đồ hồ.

**Desktop ngang:** hồ ở giữa, 4 bảng nâng cấp/thú/sổ/bản đồ chuyển thành cột bên phải, luôn mở. Phím Space thay cho chạm.

**Nguyên tắc**

- Ít chữ, nhiều biểu tượng, để dịch sang ngôn ngữ khác rẻ.
- Mỗi độ hiếm có cả màu lẫn hình viền riêng, để người mù màu vẫn phân biệt được.
- Cá hiếm lên: màn hình rung nhẹ, chữ "NEW!" và ảnh cá to giữa màn hình trong 1,5 giây.
- Âm thanh: tiếng nước và nhạc lo-fi nhẹ, tắt riêng được từng loại.

## Kiếm tiền

Doanh thu đến từ quảng cáo có thưởng mà người chơi tự chọn xem; quảng cáo xen kẽ chỉ đặt ở chỗ nghỉ tự nhiên. Mọi quảng cáo đi qua SDK của từng nền tảng, không dùng mạng quảng cáo riêng.

| Vị trí có thưởng | Phần thưởng | Giới hạn |
| --- | --- | --- |
| Nở trứng ngay | Trứng đang ấp nở lập tức | Không giới hạn |
| Nhân đôi thu offline | ×2 xu của phiên offline | 1 lần mỗi lần quay lại |
| Trứng bí ẩn | 1 trứng ngẫu nhiên của hồ hiện tại | Mỗi 15 phút |
| Thử lại boss | Tiếp tục kéo khi đứt dây | 1 lần mỗi trận |
| Mồi vàng | Luck ×2 trong 5 phút | Mỗi 10 phút |

**Quảng cáo xen kẽ** chỉ hiện khi chuyển hồ, sau trận boss, hoặc khi đóng Sổ cá. Hai lần cách nhau ít nhất 3 phút, và không bao giờ chen vào lúc đang kéo dây.

**Sau MVP** có thể thêm gói trang trí hồ trả phí, chỉ ở nền tảng nào hỗ trợ mua trong game.

## MVP, lộ trình và KPI

MVP gồm 2 hồ, bắt đầu sau khi nộp game #2. Game đi đường A (Poki, chọn 14/10): trên web chỉ phát hành ở Poki. Mốc kiểm tra khoảng 26/10, khi Poki trả lời game #2: Poki im lặng hoặc từ chối thì chuyển game #3 sang CrazyGames và các portal khác.

**Phạm vi MVP**

- [ ] Ba nhịp câu: thả, cắn, kéo
- [ ] 2 hồ, 16 loài cá, 10 thú cưng, 2 boss
- [ ] Lò ấp, Sổ cá, 4 nâng cấp
- [ ] Nhiệm vụ ngày, chuỗi đăng nhập, thu offline
- [ ] 5 vị trí quảng cáo có thưởng và quảng cáo xen kẽ
- [ ] Tích hợp SDK Poki qua adapter chung của dự án

**Lộ trình** (mốc đề xuất)

| Giai đoạn | Thời gian | Nội dung |
| --- | --- | --- |
| MVP | sau khi nộp game #2 | 2 hồ, 16 cá, 10 thú; boss, nhiệm vụ ngày; SDK Poki |
| Nộp Poki | khoảng giữa tháng 11 | Player Fit Test, Web Fit Test, duyệt; soft rồi global release (1–2 tháng) |
| Frozen Lake | vào bản nộp nếu kịp | Hồ băng, câu qua lỗ băng; thú, trang trí lễ; không cần bản cập nhật riêng |
| Cổng KPI | — | Đạt mục tiêu thì mới làm v1.2 |
| v1.2 – v1.3 | tháng 1–2/2027 | Coral Cove, Moonlit Lagoon; bảng xếp hạng; khoe hồ với bạn bè |

Đường Poki mất 1–2 tháng từ lúc nộp tới global release, nên Frozen Lake đưa vào bản nộp nếu kịp thay vì làm bản cập nhật Giáng sinh riêng.

**KPI khi thử nghiệm** (mục tiêu đề xuất, chỉnh lại theo dữ liệu thật)

| Chỉ số | Mục tiêu |
| --- | --- |
| Người chơi câu được con cá đầu tiên | ≥ 90% |
| Thời gian chơi trung bình mỗi người, ngày đầu | ≥ 10 phút |
| Người chơi mở được hồ 2 | ≥ 35% |
| Quảng cáo có thưởng mỗi người mỗi ngày | ≥ 2 |
| Tỉ lệ quay lại ngày hôm sau | ≥ 15% |

**Yêu cầu kỹ thuật**

- Phaser 4 + TypeScript và bộ khung chung của dự án. Poki cho biết game Unity có tỉ lệ người vào chơi thấp hơn game web-native.
- Tải ban đầu dưới 8 MB (yêu cầu của Poki).
- Báo sự kiện bắt đầu/dừng chơi cho SDK đúng lúc (vào hồ, mở menu).
- Lưu tiến trình cục bộ; dùng lưu đám mây của nền tảng nào có hỗ trợ.
- Không link ra ngoài, không tên thương hiệu của bên thứ ba trong game.

## Nguồn

- [CrazyGames — All Tags](https://www.crazygames.com/tags) (số game theo tag)
- [Poki — What it takes to build web games in 2026](https://poki.com/blog/building-web-browser-games-2026) (màn dọc, Unity)
- [CrazyGames Developer Guide 2026](https://app.cinevva.com/guides/publish-game-crazygames) (giới hạn 50 MB)
