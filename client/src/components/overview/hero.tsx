function Hero() {
  return (
    < >
        <h1 className="text-heading pb-2">
            SISTEM COMPUTER-AIDED DETECTION (CAD) UNTUK PENYAKIT GLAUKOMA BERDASARKAN OPTIC NERVE HEAD PADA CITRA FUNDUS
        </h1>
        
        <p className="w-2/3 text-paragraph">
            Sistem mendapatkan dukungan dari Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi melalui Skema Penelitian Terapan 668/UN17.L1/HK/2024 dan 517/UN17.L1/HK/2025.
        </p>
        <p className="text-subheading py-2">Tim Peneliti</p>
        <ul className="text-paragraph font-normal">
            <li>Prof. Dr. Ir. Anindita Septiarini, S.T., M.Cs.</li>
            <li>Prof. Dr. Ir. Hamdani, S.T., M.Cs., IPM</li>
            <li>dr. Nur Khomah Fatmawati, Sp. M</li >
            <li>Bugi Sulistiyo, S.Kom</li>
            <li>Eko Rahmat Darmawan, S.Kom</li>
        </ul>
        <a
            href="/model"
            className="mt-5 w-1/6 btn border-0 rounded-full bg-mainRed text-white font-bold hover:bg-red-300">
            Deteksi Glaukoma
        </a>
    </>
  );
}

export default Hero;