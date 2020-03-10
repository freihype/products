/*
import HTML5 from "../vendors/HTML5";
import Vimeo from "../vendors/Vimeo";
import Youtube from "../vendors/Youtube";
*/
import Session from '../vendors/Session';
export default function getVendor(src, vendor) {
  return {
    vendor: 'sr',
    component: Session
  };
  /*
  src = src || "";
  if (vendor === "youtube" || /youtube.com|youtu.be/.test(src)) {
    return { vendor: "youtube", component: Youtube };
  } else if (vendor === "vimeo" || /vimeo.com/.test(src)) {
    return { vendor: "vimeo", component: Vimeo };
  } else {
    const isAudio = vendor === "audio" || /\.(mp3|wav|m4a)($|\?)/i.test(src);
    return {
      vendor: isAudio ? "audio" : "video",
      component: HTML5
    };
  }*/
}
