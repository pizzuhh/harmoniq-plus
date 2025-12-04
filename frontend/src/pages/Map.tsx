import React from "react";

interface GoogleMapEmbedProps {
  src: string;
  width?: string | number;
  height?: string | number;
}

const GoogleMapEmbed: React.FC<GoogleMapEmbedProps> = ({
  src,
  width = "100%",
  height = "400px",
}) => {
  return ( <>
      <div style={{ width, height }}>

      <iframe
        title="Google Map"
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
        <a href ="https://www.google.com/maps/embed?pb=YOUR_LONG_QUERY_STRING"></a>
    </div>
    <div className="places">
        <i><h1>Места за отдих </h1></i>
        <ul style = {styles.list}>
            <li>Парк "Градска градина"</li>
            <li>Паркчето при "Ескулап"</li>
            <li>Парк "Острова"</li>
            <li>Парк "Стадиона"</li>
            <li>Парк "Писковец"</li>
            <li>Паркчето на "Балона"</li>
            <li>Градинката на "ПМГ К. Величков"</li>
        </ul>
    </div>
    </>
  );
};

export default GoogleMapEmbed;
const styles ={
    list: {
        listStyleType: 'none',
    } as React.CSSProperties,
}