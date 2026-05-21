import Footers from '../components/general/footer';
import Navbar from '../components/general/navbar';
import Content from '../components/overview/content';
import Hero from '../components/overview/hero';
import Logo from '../components/overview/logo';

export default function Overview() {
  return (
    <>
    
      {/* Background fundus */}
      <img
        src="/content/bg_fundus.png"
        width={700}
        height={700}
        alt="Background Fundus"
        className="absolute top-16 -right-0 opacity-60 z-0 overflow-x-hidden"
      />

      {/* Logo */}
      <div className="top-1/6 left-[35%] flex gap-4 z-10 fixed">
          <Logo imgWidth={100} imgHeight={100} />
      </div>

      <div className='w-full h-screen relative z-10 py-10'>
        {/* Head Content */}
        <Navbar/>
        
        {/* Hero Section */}
        <div className="py-44 px-[60px] z-1">
          <Hero/>
        </div>
      
      </div>
      
      {/* Content Section */}
      <div className="w-full py-20 relative z-20 bg-mainBlue/80 text-white rounded-[24px]">
        <Content/>
      </div>
        
      {/* Footer */}
      <Footers/>
    </>
  ); 
}