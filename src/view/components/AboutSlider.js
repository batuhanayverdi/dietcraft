import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css'; 
import 'slick-carousel/slick/slick-theme.css';
import { useNavigate } from 'react-router-dom';

// ✅ Resimleri import et
import AboutImage1 from '../../view/components/about1.png';
import AboutImage2 from '../../view/components/about3.png'; 
import AboutImage3 from '../../view/components/about2.png'; 

const AboutSlider = () => {
    const navigate = useNavigate();

    const settings = {
        dots: true,               
        infinite: false,          
        speed: 500,              
        slidesToShow: 1,         
        slidesToScroll: 1,        
        arrows: true,            
        autoplay: false,          
        fade: false,              
        adaptiveHeight: true      
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px', maxWidth: '100%', margin: '0 auto' }}>
            
            {/* ✅ Navigasyon Barı */}
            <nav className="navbar">
                <div className="nav-icon">⭐</div>
                <div className="nav-links">
                    <button onClick={() => navigate('/home')}>Main Page</button>
                    <button onClick={() => navigate('/about')}>About</button>
                    <button onClick={() => navigate('/login')}>Welcome</button>
                </div>
            </nav>

            {/* ✅ Slider Yapısı */}
            <Slider {...settings} style={{ marginTop: '80px' }}>
                {/* 1. Sayfa */}
                <div>
                    <img 
                        src={AboutImage1} 
                        alt="About Page 1" 
                        style={{ 
                            width: '70%', 
                            height: 'auto', 
                            objectFit: 'cover',
                            borderRadius: '20px',
                            display: 'block',
                            margin: '0 auto'  
                        }}
                    />
                </div>

                {/* 2. Sayfa */}
                <div>
                    <img 
                        src={AboutImage2} 
                        alt="About Page 2" 
                        style={{ 
                            width: '67%',  
                            height: 'auto',
                            objectFit: 'cover',
                            borderRadius: '20px',
                            display: 'block',
                            margin: '0 auto'  
                        }}
                    />
                </div>

                {/* 3. Sayfa - ✅ Get Started Butonu Eklenmiş Hali */}
                <div>
                    <img 
                        src={AboutImage3} 
                        alt="About Page 3" 
                        style={{ 
                            width: '65%',  
                            height: 'auto',
                            objectFit: 'cover',
                            borderRadius: '20px',
                            display: 'block',
                            margin: '0 auto'  
                        }}
                    />
                    <button 
                        onClick={() => navigate('/')} 
                        style={{
                            padding: '10px 20px',
                            marginTop: '20px',
                            backgroundColor: '#66d16e',
                            border: 'none',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Get Started
                    </button>
                </div>
            </Slider>
        </div>
    );
};

export default AboutSlider;
