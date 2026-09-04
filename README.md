# 🚀 Portfolio Yusuf Fadilah

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

Portfolio pribadi **Yusuf Fadilah** — mahasiswa S1 Teknik Komputer ITS, fokus di Mobile Development (Kotlin + Jetpack Compose) dan Web Development (React, Next.js, Node.js). Dibangun sebagai single-page experience dengan elemen 3D interaktif, animasi scroll GSAP, dan smooth scrolling Lenis.

---

## ✨ Fitur

- **Environment 3D interaktif** — Three.js + three-stdlib (GLTF + Draco).
- **Animasi sinematik** — GSAP + ScrollTrigger, termasuk section Work yang di-pin horizontal.
- **Smooth scrolling** — Lenis.
- **Responsif** — layout menyesuaikan mobile, tablet, dan desktop.
- **Data terpusat** — seluruh isi portfolio dibaca dari satu file `src/config.ts`.
- **Cepat** — Vite 5 + code splitting manual (`three`, `react-three`, `gsap`, `vendor`).

---

## 🛠️ Tech Stack

| Kategori | Tools |
| :--- | :--- |
| **Frontend** | React 18, TypeScript 5, CSS |
| **3D Engine** | Three.js, three-stdlib |
| **Animasi** | GSAP (ScrollTrigger), Lenis |
| **Build Tool** | Vite 5 |
| **Deployment** | Vercel |

---

## 🏁 Menjalankan Project

```bash
npm install      # install dependency
npm run dev      # development server
npm run build    # build production (tsc -b && vite build)
npm run preview  # preview hasil build
npm run lint     # eslint
```

---

## ⚙️ Struktur Data

- `src/config.ts` — sumber tunggal untuk identitas, deskripsi, pengalaman/organisasi, daftar project, skill, dan link kontak.
- `src/components/TechStackNew.tsx` — daftar ikon tech stack (piramida 12 → 9 → 6 → 4).
- `public/images/projects/` — gambar/preview tiap project.
- `src/components/styles/` — CSS per komponen; variabel warna global ada di `src/index.css`.

---

## 🔗 Kontak

**Yusuf Fadilah**
*Mobile & Web Developer*

[LinkedIn](https://www.linkedin.com/in/yusuf-fadllh/) | [GitHub](https://github.com/yusuffadllh)

---

## 📄 Lisensi & Kredit

Distribusikan di bawah [MIT License](LICENSE).

Template dasar: [codexahmar/3D-portfolio](https://github.com/codexahmar/3D-portfolio) — seluruh konten, data, dan aset pada repo ini sudah diganti menjadi milik Yusuf Fadilah.

