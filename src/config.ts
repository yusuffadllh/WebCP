export const config = {
    developer: {
        name: "Yusuf",
        fullName: "Yusuf Fadilah",
        title: "Mobile & Web Developer",
        description: "Mahasiswa Teknik Komputer ITS yang membangun aplikasi Android dan web modern. Terbiasa bekerja dengan Kotlin & Jetpack Compose untuk mobile, React/Next.js & Node.js untuk web, serta integrasi AI dan REST API ke dalam produk nyata."
    }
    ,
    social: {
        github: "yusuffadllh",
        email: "yusuffadilah371@gmail.com",
        location: "Surabaya, Indonesia"
    },
    about: {
        title: "About Me",
        description: "Saya Yusuf Fadilah, mahasiswa S1 Teknik Komputer Institut Teknologi Sepuluh Nopember angkatan 2024. Ketertarikan saya di bidang IT membuat saya banyak membangun proyek sendiri: aplikasi Android dengan Kotlin & Jetpack Compose, aplikasi web full-stack dengan React, Express, dan MySQL, sampai automation dan AI agent berbasis Node.js. Saya antusias belajar teknologi baru, berkontribusi di bidang IT, dan memperluas relasi selama masa perkuliahan."
    },
    experiences: [
        {
            position: "S1 Teknik Komputer",
            company: "Institut Teknologi Sepuluh Nopember",
            period: "2024 - Present",
            location: "Surabaya, Indonesia",
            description: "Menempuh pendidikan sarjana di Departemen Teknik Komputer ITS, memperdalam dasar pemrograman, struktur data, algoritma, dan sistem komputer sambil membangun proyek pribadi di bidang mobile dan web development.",
            responsibilities: [
                "Mempelajari pemrograman lanjut, struktur data, dan algoritma",
                "Mengerjakan tugas praktikum berbasis C++, Python, dan pengembangan aplikasi",
                "Membangun proyek pribadi Android (Kotlin) dan web (React, Node.js) di luar perkuliahan",
                "Aktif mengikuti kegiatan dan komunitas kampus di bidang teknologi"
            ],
            technologies: ["C++", "Python", "Kotlin", "TypeScript", "Algoritma & Struktur Data", "Git"]
        },
        {
            position: "Koordinator Sie Perlengkapan",
            company: "Pemilihan Raya HIMATRO Universitas Lampung",
            period: "November 2024 - Desember 2024",
            location: "Bandar Lampung, Indonesia",
            description: "Memimpin Sie Perlengkapan dengan 15 anggota pada rangkaian acara Pemilihan Raya HIMATRO, bertanggung jawab atas seluruh akomodasi dan kebutuhan peralatan seluruh sie.",
            responsibilities: [
                "Mengkoordinir 15 anggota sie perlengkapan selama rangkaian acara",
                "Bertanggung jawab atas akomodasi, perlengkapan, dan kebutuhan peralatan",
                "Memenuhi permintaan peralatan dari sie lain secara tepat waktu",
                "Melakukan pendataan dan pengembalian perlengkapan acara"
            ],
            technologies: ["Kepemimpinan", "Koordinasi Tim", "Manajemen Acara", "Problem Solving"]
        },
        {
            position: "Anggota Himpunan Mahasiswa Teknik Elektro",
            company: "HIMATRO Universitas Lampung",
            period: "November 2023 - April 2024",
            location: "Bandar Lampung, Indonesia",
            description: "Menjadi anggota HIMATRO selama satu periode kepengurusan, terlibat dalam kepanitiaan, program kerja, serta rapat dan diskusi internal himpunan.",
            responsibilities: [
                "Mengikuti kepanitiaan dan menjalankan program kerja himpunan",
                "Berpartisipasi dalam rapat dan diskusi internal",
                "Menjadi Staff Sie Humas Musyawarah Besar HIMATRO (Desember 2024)",
                "Menjadi Staff Sie Konsumsi HUT HIMATRO (Februari 2024)"
            ],
            technologies: ["Kerja Sama Tim", "Komunikasi", "Public Relations", "Organisasi"]
        },
        {
            position: "Anggota UKM Badminton",
            company: "Unit Kegiatan Mahasiswa",
            period: "September 2023 - April 2024",
            location: "Bandar Lampung, Indonesia",
            description: "Anggota UKM Badminton selama satu periode kepengurusan: mengikuti latihan rutin, bakti sosial UKM, perlombaan badminton, dan rapat internal.",
            responsibilities: [
                "Mengikuti latihan rutin dan perlombaan badminton",
                "Terlibat dalam kegiatan bakti sosial UKM",
                "Menghadiri rapat internal kepengurusan",
                "Membangun disiplin, konsistensi, dan kerja sama tim"
            ],
            technologies: ["Disiplin", "Kerja Sama Tim", "Konsistensi", "Manajemen Waktu"]
        }
    ],
    projects: [
        {
            id: 1,
            title: "CPRecap",
            category: "Android · Personal Finance",
            technologies: "Kotlin, Jetpack Compose, Material 3, Hilt, Room + SQLCipher, Firebase, WorkManager, Gemini",
            image: "/images/projects/cprecap.jpeg",
            link: "https://github.com/yusuffadllh/CPRecap",
            description:
                "Aplikasi manajemen keuangan pribadi berbasis Kotlin + Jetpack Compose dengan deteksi transaksi otomatis berbantuan AI. Dibangun memakai Clean Architecture + MVVM, database Room terenkripsi SQLCipher, sinkronisasi Firebase, dan background task via WorkManager."
        },

        {
            id: 2,
            title: "GrabMakan",
            category: "Full-Stack Web",
            technologies: "React 19, Vite, Tailwind CSS, Express 5, MySQL, JWT, bcrypt",
            image: "/images/projects/grabmakan.png",
            link: "https://github.com/yusuffadllh/grabmakan_review",
            description:
                "Platform pemesanan makanan online dengan pelacakan status pesanan real-time dan sistem ulasan terperinci untuk restoran, kurir, serta tiap menu. Arsitektur decoupled: frontend React + Vite + Tailwind, backend REST API Express + MySQL dengan autentikasi JWT."
        },

        {
            id: 3,
            title: "CPAgents",
            category: "AI Agent Platform",
            technologies: "Next.js 14, Prisma 7, SQLite, OpenCode CLI, Server-Sent Events",
            image: "/images/projects/cpagents.svg",
            link: "https://github.com/yusuffadllh/CPAgents",
            description:
                "Web app AI agent otonom yang memecah sebuah goal menjadi task, mengeksekusinya secara nyata lewat OpenCode, mengevaluasi hasilnya, lalu mengulang sampai tuntas — dan men-deploy hasilnya sendiri ke Vercel/Netlify. Log eksekusi dialirkan real-time ke UI lewat SSE."
        },

        {
            id: 4,
            title: "CPChatRemind",
            category: "Automation · WhatsApp Bot",
            technologies: "Node.js 24, TypeScript, Baileys, Google Gemini, CalDAV (Radicale), Docker Compose",
            image: "/images/projects/cpchatremind.svg",
            link: "https://github.com/yusuffadllh/CPChatRemind",
            description:
                "Bot WhatsApp pribadi yang mengubah pesan biasa menjadi jadwal: isi pesan diekstrak oleh Gemini lalu dibuat sebagai event CalDAV di Radicale, sehingga langsung muncul di aplikasi Kalender Android melalui DAVx5. Dideploy dengan Docker Compose."
        },

        {
            id: 5,
            title: "Dijkstra Visualizer",
            category: "Algorithm Visualization",
            technologies: "Python, Tkinter, Pillow, heapq",
            image: "/images/projects/pathfinding.png",
            link: "https://github.com/yusuffadllh/Tkinter-Graph-Pathfinding",
            description:
                "Aplikasi GUI interaktif untuk menyusun graf di atas gambar peta dan mencari rute terpendek antar node dengan algoritma Dijkstra. Mendukung node berlabel, waypoint, pembuatan edge dengan bobot jarak Euclidean, serta visualisasi hasil pencarian."
        },

        {
            id: 6,
            title: "AutoRedeem RF",
            category: "Chrome Extension",
            technologies: "JavaScript, Chrome Manifest V3, Discord Webhook",
            image: "/images/projects/autoredeem.png",
            link: "https://github.com/yusuffadllh/AutoRedeem-RF",
            description:
                "Chrome Extension (Manifest V3) yang otomatis mencoba redeem hadiah di cloudemulator.net dengan berpindah server secara acak, lengkap dengan notifikasi Discord Webhook setiap kali berhasil."
        },

        {
            id: 7,
            title: "Proglan C++ Exercises",
            category: "Coursework · C++",
            technologies: "C++, Algoritma, Struktur Kontrol",
            image: "/images/projects/proglan.svg",
            link: "https://github.com/yusuffadllh/Proglan-p4-5024241025",
            description:
                "Kumpulan penyelesaian tugas praktikum Pemrograman Lanjut Teknik Komputer ITS memakai C++, mencakup logika program, struktur kontrol, dan penerapan dasar algoritma."
        }
    ],
    contact: {
        email: "yusuffadilah371@gmail.com",
        github: "https://github.com/yusuffadllh",
        linkedin: "https://www.linkedin.com/in/yusuf-fadllh/",
        // Tidak punya akun X/Twitter -> dibiarkan kosong, ikonnya otomatis tidak dirender.
        twitter: "",
        instagram: "https://www.instagram.com/yusuf.fdlhh",
        resume: "https://drive.google.com/file/d/11oQSjsjyadB9DFYLkPWEdybaG_gOBHtO/view?usp=sharing"
    },
    skills: {
        develop: {
            title: "MOBILE DEVELOPER",
            description: "Aplikasi Android modern dengan Kotlin & Jetpack Compose",
            details:
                "Membangun aplikasi Android dari nol memakai Kotlin dan Jetpack Compose: Clean Architecture + MVVM, penyimpanan lokal terenkripsi, integrasi Firebase, background task, sampai fitur berbantuan AI.",
            tools: ["Kotlin", "Jetpack Compose", "Material 3", "Hilt", "Room", "Firebase", "WorkManager", "Android Studio", "Gradle", "Gemini API"]
        },

        design: {
            title: "WEB DEVELOPER",
            description: "Web app full-stack & automation berbasis Node.js",
            details:
                "Mengembangkan aplikasi web responsif dan REST API yang scalable dengan React, Next.js, dan Express, serta membangun automation dan AI agent memakai Node.js, TypeScript, dan database relasional.",
            tools: ["React", "Next.js", "TypeScript", "Node.js", "Express", "MySQL", "Prisma", "Tailwind CSS", "Vite", "Docker"]
        }
    }
};


