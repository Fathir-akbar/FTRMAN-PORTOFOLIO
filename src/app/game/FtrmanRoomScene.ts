// Scene kamar FTRMAN — mini game jalan-jalan side-view (tampak samping),
// sesuai sketsa referensi: vas bunga kiri, komputer di meja (monitor +
// keyboard + mouse), rak buku 1 baris menempel di tembok (melayang),
// tempat tidur di kanan. Karakter jalan kiri-kanan di depan tembok.
//
// Interaksi (dekati + tekan E):
//  - Komputer di meja  -> popup Skills
//  - Rak buku tembok   -> popup My Project
//  - Bingkai foto      -> popup profil About
//
// Semua tekstur digambar prosedural (pixel art) & di-upscale NEAREST.
// Kalau nanti sprite buatanmu sudah ada, tinggal ganti generator tekstur
// ini dengan this.load.spritesheet — movement & interaksi gak perlu diubah.

import Phaser from "phaser";

// Viewport game: kamar 192x192 ditampilkan dengan zoom 2x biar keliatan
// besar & pixel-nya tajam.
const ZOOM = 2;
const GAME_W = 384;
const GAME_H = 384;
const ROOM_W = 192;
const ROOM_H = 192;

// Garis lantai: tembok dari atas sampai sini, sisanya lantai kayu.
const FLOOR_Y = 148;

// Posisi objek (koordinat game 192x192)
const VASE_X = 16; // vas bunga, pojok kiri (berdiri di lantai)
const DESK_X = 72; // meja komputer (tengah kiri)
const FRAME_X = 100; // bingkai foto about-me (nempel tembok)
const FRAME_Y = 66;
const SHELF_X = 118; // rak buku 1 baris melayang (tembok, tengah kanan)
const SHELF_Y = 52;
const BED_X = 167; // tempat tidur (kanan, berdiri di lantai)
const PLAYER_Y = 170; // baseline karakter (kaki di lantai)

// ===== Generator tekstur pixel (digambar ke canvas kecil) =====

// Latar ruangan 192x192: tembok polos + lis bawah + lantai papan kayu.
// Digambar sekali sebagai 1 gambar biar draw call kecil.
function drawRoomBg(scene: Phaser.Scene, key: string): void {
  const g = scene.add.graphics();
  g.setVisible(false);
  // Tembok
  g.fillStyle(0x343743, 1);
  g.fillRect(0, 0, ROOM_W, FLOOR_Y);
  // Panel garis horizontal tipis di tembok (biar gak polos banget)
  g.fillStyle(0x3d404d, 1);
  g.fillRect(0, 34, ROOM_W, 1);
  g.fillRect(0, 82, ROOM_W, 1);
  g.fillRect(0, 122, ROOM_W, 1);
  // Lis/plint tembok bawah
  g.fillStyle(0x23252c, 1);
  g.fillRect(0, FLOOR_Y - 6, ROOM_W, 6);
  g.fillStyle(0x414451, 1);
  g.fillRect(0, FLOOR_Y - 6, ROOM_W, 1);
  // Lantai papan kayu
  g.fillStyle(0x6e4a2f, 1);
  g.fillRect(0, FLOOR_Y, ROOM_W, ROOM_H - FLOOR_Y);
  // Nat antar papan (horizontal)
  g.fillStyle(0x4f3319, 1);
  g.fillRect(0, FLOOR_Y + 14, ROOM_W, 1);
  g.fillRect(0, FLOOR_Y + 30, ROOM_W, 1);
  // Sambungan vertikal papan (selang-seling)
  for (let row = 0; row < 3; row++) {
    const y = FLOOR_Y + row * 15;
    const off = row % 2 === 0 ? 24 : 96;
    g.fillRect(off, y, 1, 14);
    g.fillRect((off + 120) % ROOM_W, y, 1, 14);
  }
  // Serat kayu tipis
  g.fillStyle(0x7d5638, 1);
  g.fillRect(30, FLOOR_Y + 5, 18, 1);
  g.fillRect(110, FLOOR_Y + 9, 24, 1);
  g.fillRect(60, FLOOR_Y + 21, 20, 1);
  g.fillRect(150, FLOOR_Y + 25, 16, 1);
  g.fillRect(10, FLOOR_Y + 38, 22, 1);
  g.generateTexture(key, ROOM_W, ROOM_H);
  g.destroy();
}

// Karakter side-view 12x16 px (menghadap kanan; dibalik pakai flipX):
// rambut + wajah + hoodie gading (warna situs) + celana + sepatu.
function drawPlayer(scene: Phaser.Scene, key: string): void {
  const g = scene.add.graphics();
  g.setVisible(false);
  g.fillStyle(0x2a2320, 1); // rambut (belakang kepala)
  g.fillRect(2, 0, 7, 4);
  g.fillStyle(0xe8b98a, 1); // wajah (depan kanan)
  g.fillRect(7, 2, 4, 4);
  g.fillStyle(0x2a2320, 1); // poni
  g.fillRect(7, 1, 4, 2);
  g.fillStyle(0xf4f5ef, 1); // hoodie badan
  g.fillRect(2, 6, 8, 6);
  g.fillStyle(0xc9ccc4, 1); // shading hoodie bawah
  g.fillRect(2, 10, 8, 2);
  g.fillStyle(0xe8b98a, 1); // tangan
  g.fillRect(9, 8, 2, 3);
  g.fillStyle(0x3a3f4a, 1); // celana
  g.fillRect(3, 12, 3, 3);
  g.fillRect(7, 12, 3, 3);
  g.fillStyle(0x1d1d24, 1); // sepatu
  g.fillRect(2, 15, 4, 1);
  g.fillRect(7, 15, 4, 1);
  g.generateTexture(key, 12, 16);
  g.destroy();
}

// Meja komputer side-view (42x36 px): kaki meja + monitor + stand + mouse.
// Keyboard-nya digambar terpisah tipis di atas top meja.
function drawDeskPc(scene: Phaser.Scene, key: string): void {
  const g = scene.add.graphics();
  g.setVisible(false);
  // Kaki meja
  g.fillStyle(0x6b4526, 1);
  g.fillRect(3, 22, 4, 14);
  g.fillRect(35, 22, 4, 14);
  // Badan + top meja
  g.fillStyle(0x8a5a35, 1);
  g.fillRect(0, 19, 42, 4);
  g.fillStyle(0xa06d42, 1);
  g.fillRect(0, 17, 42, 3);
  // Keyboard tipis di atas meja
  g.fillStyle(0x2e2e38, 1);
  g.fillRect(16, 15, 16, 2);
  g.fillStyle(0x4a4a58, 1);
  g.fillRect(17, 15, 14, 1);
  // Monitor: casing gelap + layar nyala
  g.fillStyle(0x1a1a22, 1);
  g.fillRect(2, 0, 22, 14);
  g.fillStyle(0x39d0ff, 1); // layar
  g.fillRect(4, 2, 18, 9);
  g.fillStyle(0x1f6f8f, 1); // kilau layar
  g.fillRect(4, 2, 18, 2);
  g.fillStyle(0x0d3b2e, 1); // baris kode di layar
  g.fillRect(6, 5, 10, 1);
  g.fillRect(6, 8, 7, 1);
  g.fillStyle(0x1a1a22, 1); // stand monitor
  g.fillRect(10, 14, 6, 3);
  // Mouse di samping kanan
  g.fillStyle(0x2e2e38, 1);
  g.fillRect(35, 14, 5, 3);
  g.generateTexture(key, 42, 36);
  g.destroy();
}

// Rak buku tembok 1 baris (36x22 px): papan melayang + bracket wall-mount
// + buku warna-warni berdiri di atas papan.
function drawWallShelf(scene: Phaser.Scene, key: string): void {
  const g = scene.add.graphics();
  g.setVisible(false);
  // Buku-buku (digambar dulu biar kepanjangan papan di belakangnya)
  const books = [0xd8524a, 0x3fa7d6, 0xffc94d, 0x4fae6b, 0xc06bd8];
  books.forEach((color, i) => {
    const bx = 5 + i * 5;
    const bh = i % 2 === 0 ? 12 : 10; // tinggi selang-seling biar gak kaku
    g.fillStyle(color, 1);
    g.fillRect(bx, 17 - bh, 4, bh);
    g.fillStyle(0x00000040, 1); // guratan buku
    g.fillRect(bx, 17 - bh + 2, 4, 1);
  });
  // Satu buku miring di ujung
  g.fillStyle(0xe8e3d5, 1);
  g.fillRect(30, 8, 3, 9);
  // Papan kayu (melayang)
  g.fillStyle(0xa06d42, 1); // top papan
  g.fillRect(0, 17, 36, 3);
  g.fillStyle(0x6b4526, 1); // sisi papan
  g.fillRect(0, 20, 36, 2);
  // Bracket segitiga kiri & kanan
  g.fillStyle(0x3a2712, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(4, 22),
      new Phaser.Math.Vector2(4, 14),
      new Phaser.Math.Vector2(12, 22),
    ],
    true
  );
  g.fillPoints(
    [
      new Phaser.Math.Vector2(32, 22),
      new Phaser.Math.Vector2(32, 14),
      new Phaser.Math.Vector2(24, 22),
    ],
    true
  );
  g.generateTexture(key, 36, 22);
  g.destroy();
}

// Tempat tidur side-view (38x26 px): rangka kayu + kasur + bantal putih +
// selimut oranye (aksen situs) + kepala ranjang.
function drawBedSide(scene: Phaser.Scene, key: string): void {
  const g = scene.add.graphics();
  g.setVisible(false);
  // Rangka bawah
  g.fillStyle(0x6b4526, 1);
  g.fillRect(0, 20, 38, 4);
  g.fillRect(2, 24, 3, 2); // kaki
  g.fillRect(33, 24, 3, 2);
  // Kepala ranjang (kiri)
  g.fillStyle(0x6b4526, 1);
  g.fillRect(0, 4, 3, 18);
  // Kasur
  g.fillStyle(0xe8e3d5, 1);
  g.fillRect(3, 14, 35, 6);
  // Bantal (nempel kepala ranjang)
  g.fillStyle(0xf4f5ef, 1);
  g.fillRect(5, 10, 9, 5);
  // Selimut oranye
  g.fillStyle(0xffa52d, 1);
  g.fillRect(15, 12, 23, 8);
  g.fillStyle(0xe0912a, 1); // lipatan selimut
  g.fillRect(15, 12, 23, 1);
  g.fillRect(15, 16, 23, 1);
  g.generateTexture(key, 38, 26);
  g.destroy();
}

// Vas bunga side-view (12x22 px): pot tanah + tangkai + daun + bunga.
function drawVase(scene: Phaser.Scene, key: string): void {
  const g = scene.add.graphics();
  g.setVisible(false);
  // Pot (lebar di atas, menyempit ke bawah)
  g.fillStyle(0xa05a2c, 1);
  g.fillRect(2, 14, 8, 2);
  g.fillRect(3, 16, 6, 5);
  g.fillStyle(0x7a4020, 1); // bibir pot
  g.fillRect(2, 14, 8, 1);
  // Tangkai
  g.fillStyle(0x2f7a48, 1);
  g.fillRect(5, 6, 2, 8);
  // Daun kiri & kanan
  g.fillRect(2, 8, 3, 2);
  g.fillRect(7, 10, 3, 2);
  // Bunga (kelopak + tengah)
  g.fillStyle(0xe86bb0, 1);
  g.fillRect(4, 2, 4, 4);
  g.fillStyle(0xffc94d, 1);
  g.fillRect(5, 3, 2, 2);
  g.generateTexture(key, 12, 22);
  g.destroy();
}

// Bingkai foto (16x20 px): rangka kayu + matte gading + lubang gelap.
// Fotonya (about-me) ditempel terpisah di atas lubang pas create().
function drawPhotoFrame(scene: Phaser.Scene, key: string): void {
  const g = scene.add.graphics();
  g.setVisible(false);
  g.fillStyle(0x3a2712, 1); // rangka luar
  g.fillRect(0, 0, 16, 20);
  g.fillStyle(0x5a3a1e, 1); // bevel rangka
  g.fillRect(1, 1, 14, 18);
  g.fillStyle(0xe8e3d5, 1); // matte putih gading
  g.fillRect(2, 2, 12, 16);
  g.fillStyle(0x1a120c, 1); // lubang foto
  g.fillRect(4, 4, 8, 12);
  g.generateTexture(key, 16, 20);
  g.destroy();
}

// Logo kaca pembesar (12x12 px): hint interact — muncul di atas objek pas
// karakternya deket.
function drawMagnifier(scene: Phaser.Scene, key: string): void {
  const g = scene.add.graphics();
  g.setVisible(false);
  g.lineStyle(1, 0xf4f5ef, 1); // lensa
  g.strokeCircle(5, 5, 4);
  g.fillStyle(0xffa52d, 0.35); // kaca ke-orange dikit
  g.fillCircle(5, 5, 3);
  g.lineStyle(2, 0xf4f5ef, 1); // gagang
  g.lineBetween(8, 8, 11, 11);
  g.generateTexture(key, 12, 12);
  g.destroy();
}

export default class FtrmanRoomScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private player!: Phaser.GameObjects.Sprite;
  private photoHint!: Phaser.GameObjects.Container;
  private pcHint!: Phaser.GameObjects.Container;
  private shelfHint!: Phaser.GameObjects.Container;

  constructor() {
    super("FtrmanRoom");
  }

  preload(): void {
    // Foto buat bingkai interaktif (ambil dr aset about yang udah ada)
    this.load.image("about-photo", "/images/about-me-FTRMAN.png");
  }

  create(): void {
    // --- Tekstur pixel ---
    drawRoomBg(this, "room-bg");
    drawPlayer(this, "player");
    drawDeskPc(this, "desk-pc");
    drawWallShelf(this, "wall-shelf");
    drawBedSide(this, "bed-side");
    drawVase(this, "vase");
    drawPhotoFrame(this, "photo-frame");
    drawMagnifier(this, "magnifier");

    // --- Latar ruangan (tembok + lantai) ---
    this.add.image(0, 0, "room-bg").setOrigin(0, 0).setDepth(0);

    // --- Properti ruangan (urutan kiri -> kanan, sesuai sketsa) ---

    // Vas bunga di pojok kiri (berdiri di lantai)
    this.add.image(VASE_X, 174, "vase").setOrigin(0.5, 1).setDepth(3);

    // Meja komputer (monitor + keyboard + mouse di atasnya)
    this.add.image(DESK_X, 174, "desk-pc").setOrigin(0.5, 1).setDepth(3);

    // Bingkai foto about-me nempel di tembok (antar meja & rak)
    this.add.image(FRAME_X, FRAME_Y, "photo-frame").setDepth(2);
    const photo = this.add.image(FRAME_X, FRAME_Y, "about-photo").setDepth(3);
    // Foto di-fit (contain) ke lubang bingkai 8x12
    photo.setScale(Math.min(8 / photo.width, 12 / photo.height));

    // Rak buku 1 baris melayang nempel tembok
    this.add
      .image(SHELF_X, SHELF_Y, "wall-shelf")
      .setOrigin(0, 0)
      .setDepth(2);

    // Tempat tidur di kanan (berdiri di lantai)
    this.add.image(BED_X, 174, "bed-side").setOrigin(0.5, 1).setDepth(3);

    // --- Hint interact: kaca pembesar + badge "E", muncul pas deket ---
    const makeHint = (x: number, y: number) =>
      this.add
        .container(x, y, [
          this.add.image(0, 0, "magnifier"),
          this.add
            .text(9, 3, "E", {
              fontFamily: "monospace",
              fontSize: "8px",
              color: "#ffa52d",
            })
            .setResolution(2),
        ])
        .setDepth(5)
        .setVisible(false);

    this.pcHint = makeHint(DESK_X, 130); // di atas monitor
    this.photoHint = makeHint(FRAME_X, FRAME_Y + 28); // di bawah bingkai
    this.shelfHint = makeHint(SHELF_X + 18, SHELF_Y - 8); // di atas buku

    // --- Player side-view: jalan kiri-kanan di depan tembok ---
    this.player = this.add.sprite(DESK_X, PLAYER_Y, "player").setDepth(4);
    this.player.setFlipX(false);

    // --- Input: WASD + panah ---
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyW = this.input.keyboard!.addKey("W");
    this.keyA = this.input.keyboard!.addKey("A");
    this.keyS = this.input.keyboard!.addKey("S");
    this.keyD = this.input.keyboard!.addKey("D");
    this.keyE = this.input.keyboard!.addKey("E");

    // --- Label UI (pin ke kamera, posisi dlm koordinat world) ---
    this.add
      .text(8, 6, "FTRMAN ROOM", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#8e918b",
      })
      .setResolution(2)
      .setScrollFactor(0)
      .setDepth(10);

    // --- Kamera: zoom 2x, kamar pas penuh 1 layar ---
    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.setZoom(ZOOM);
    this.cameras.main.setRoundPixels(true);
  }

  update(_time: number, delta: number): void {
    const speed = 0.085; // px per ms — side-view santai

    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const moving = left !== right; // XOR: salah satu yg ditekan

    if (moving) {
      this.player.x += (right ? speed : -speed) * delta;
      this.player.x = Phaser.Math.Clamp(this.player.x, 12, ROOM_W - 12);
      this.player.setFlipX(left); // menghadap arah jalan
      // Bob jalan pelan (goyang naik-turun 1px)
      this.player.y = PLAYER_Y + (Math.sin(this.time.now / 90) > 0 ? 0 : -1);
    } else {
      this.player.y = PLAYER_Y;
    }

    // --- Hint & interaksi E (prioritas objek terdekat) ---
    const px = this.player.x;
    const nearPc = Math.abs(px - DESK_X) < 26;
    const nearFrame = Math.abs(px - FRAME_X) < 20 && !nearPc;
    const nearShelf = Math.abs(px - (SHELF_X + 18)) < 26 && !nearPc && !nearFrame;

    const float = Math.sin(this.time.now / 180) * 1.2;
    this.pcHint.setVisible(nearPc);
    if (nearPc) {
      this.pcHint.y = 130 + float;
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.game.events.emit("ftrman:open-skills");
      }
    }

    this.photoHint.setVisible(nearFrame);
    if (nearFrame) {
      this.photoHint.y = FRAME_Y + 28 + float;
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.game.events.emit("ftrman:open-about");
      }
    }

    this.shelfHint.setVisible(nearShelf);
    if (nearShelf) {
      this.shelfHint.y = SHELF_Y - 8 + float;
      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.game.events.emit("ftrman:open-projects");
      }
    }
  }
}

// Factory game: dipanggil dari React (client) begitu overlay dibuka.
export const createFtrmanRoomGame = (parent: HTMLElement): Phaser.Game =>
  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_W,
    height: GAME_H,
    backgroundColor: "#141318",
    pixelArt: true, // NEAREST + crisp edges -> pixel art tajam
    scene: [FtrmanRoomScene],
  });
