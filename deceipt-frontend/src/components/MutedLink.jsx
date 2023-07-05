import gsap from "gsap";
import React, { useEffect, useRef } from "react";
import styles from "./MutedLink.module.css";

const MutedLink = ({ url, children, style,onClick }) => {
  const linkRef = useRef();
  const lineRef = useRef();
  useEffect(() => {
    linkRef.current.tl = gsap.timeline({ paused: true });
    linkRef.current.tl.fromTo(
      lineRef.current,
      {
        width: "0%",
        left: "0%",
      },
      {
        width: "100%",
        duration: 0.5,
      }
    );

    linkRef.current.tl.add("midway");

    linkRef.current.tl.fromTo(
      lineRef.current,
      {
        width: "100%",
        left: "0%",
      },
      {
        width: "0%",
        left: "100%",
        duration: 0.25,
        immediateRender: false,
      }
    );
    linkRef.current.addEventListener("mouseenter", () => {
      linkRef.current.tl.tweenFromTo(0, "midway");
    });
    linkRef.current.addEventListener("mouseleave", () => {
      linkRef.current.tl.play();
    });

    return () => {};
  }, []);

  return (
    <a
      href={url || ""}
      style={style && style}
      className={styles.mutedLink}
      ref={linkRef}
      onClick={onClick}
    >
      {children}
      <span className={styles.underline} ref={lineRef}></span>
    </a>
  );
};

export default MutedLink;
