import React, { useRef, useState, useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import IconButton from "../../components/IconButton";
import styles from "./Navbar.module.css";
import { useEffect } from "react";
import gsap from "gsap";
import Flip from "gsap/Flip";
import { currentUser, auth, signOutUser } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
const Navbar = () => {
  const navRef = useRef();
  const [width, setWidth] = useState(window.innerWidth);
  const [loggedIn, setLoggedIn] = useState(currentUser || false);
  const updateWidth = () => { location.reload(); setWidth(window.innerWidth); }
  const navigate = useNavigate();
  gsap.registerPlugin(Flip);

  //window size listener to change navbar tpe
  useEffect(() => {
    window.addEventListener("resize", updateWidth);
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(user);
    });

    return unsubscribe;
  }, []);
  const onPageLoad = () => {
    const listItems = Array.from(
      width >= 1024
        ? document.querySelectorAll(
            `.${styles.mainNav} li:not(.${styles.logo})`
          )
        : document.querySelectorAll(`.${styles.bottom} li`)
    );
    const activeNav = document.querySelector(`.${styles.activeLi}`);
    gsap.to(listItems, { opacity: 0.75 });
    const res = listItems.filter((item) => {
      return item.getAttribute("data-active-nav") === "active";
    });
    gsap.to(res[0], { opacity: 1 });
    listItems.forEach((item) => {
      //handle active nav underline animation
      item.addEventListener("click", () => {
        gsap.to(listItems, {
          opacity: 0.75,
          attr: { ["data-active-nav"]: "not-active" },
        });
        gsap.to(item, {
          opacity: 1,
          attr: { ["data-active-nav"]: "active" },
        });
        const state = Flip.getState(activeNav);
        item.appendChild(activeNav);
        const duration = width >= 1024 ? 1 : 1.25;
        Flip.from(state, {
          duration: duration,
          absolute: true,
          ease: "elastic.out(1,0.5)",
        });
        navigate(item.getAttribute("data-navigate"));
      });
      //handle hover animation
      item.addEventListener("mouseenter", () => {
        gsap.to(item, {
          opacity: 0.9,
        });
      });
      item.addEventListener("mouseleave", () => {
        gsap.to(item, {
          opacity:
            item.getAttribute("data-active-nav") === "active" ? 1 : 0.85,
        });
      });
    });
  };
  useEffect(() => {
    console.log("hello");
    onPageLoad();
    // Check if the page has already loaded
  }, [width]);
  return !loggedIn ? (
    <Outlet />
  ) : (
    <nav ref={navRef} onLoad = {onPageLoad}>
      <ul className={styles.top}>
        <div className={styles.mainNav}>
          <li className={styles.logo}>
            <a href="/">
              <img src="src/assets/Logo.svg" alt="Logo" />
            </a>
          </li>
          {width >= 1024 ? (
            <>
              <li data-navigate="/" data-active-nav="active">
                <IconButton
                  icon={{
                    url: "src/assets/icons/expense.svg",
                    alt: "Expenses Icon",
                  }}
                >
                  <span>
                    Expense <br /> History
                  </span>
                </IconButton>
                <div className={styles.activeLi}></div>
              </li>
              <li data-navigate="/uploadImage">
                <IconButton
                  icon={{
                    url: "src/assets/icons/capture.svg",
                    alt: "Camera Icon",
                  }}
                >
                  <span>
                    Upload <br /> Receipts
                  </span>
                </IconButton>
              </li>
              <li data-navigate="/signup">
                <IconButton
                  icon={{
                    url: "src/assets/icons/settings.svg",
                    alt: "Settings Icon",
                  }}
                >
                  <span>Settings</span>
                </IconButton>
              </li>
            </>
          ) : (
            ""
          )}
        </div>
        <div className={styles.profile}>
          <li>
            <IconButton
              flexFlow="row-reverse"
              size="sm"
              icon={{
                url: "src/assets/icons/notification.svg",
                alt: "Notification Icon",
              }}
            >
              {width > 912 ? <span>Notifications</span> : ""}
            </IconButton>
          </li>
          <li>
            <IconButton
              icon={{
                url: "src/assets/icons/profile.svg",
                alt: "Profile Icon",
              }}
              size="sm"
            >
              <img src="src/assets/icons/chevron-down.svg" alt="Chevron Icon" />
            </IconButton>
          </li>
          <li className={styles.logout}>
            <button
                onClick={() => {
                localStorage.setItem("loadingState", "") 
                signOutUser();
                 
              }}
            >
              Logout
            </button>
          </li>
        </div>
        <div className={styles.wave}>
          <img
            src={`src/assets/wave-${width >= 912 ? "desktop" : "mobile"}.svg`}
            alt="decoration"
          />
        </div>
      </ul>
      <Outlet />
      {width < 1024 ? (
        <ul className={styles.bottom}>
          <li data-navigate="/" data-active-nav="active">
            <IconButton
              icon={{
                url: "src/assets/icons/expense.svg",
                alt: "Expenses Icon",
              }}
              shadow="shadow"
            >
              {width > 912 ? <span>Expense History</span> : ""}
            </IconButton>
            <div className={styles.activeLi}></div>
          </li>
          <li data-navigate="/uploadImage">
            <IconButton
              icon={{
                url: "src/assets/icons/capture.svg",
                alt: "Camera Icon",
              }}
              shadow="shadow"
            >
              {width > 912 ? <span>Capture</span> : ""}
            </IconButton>
          </li>
          <li data-navigate="/signup">
            <IconButton
              icon={{
                url: "src/assets/icons/settings.svg",
                alt: "Settings Icon",
              }}
              shadow="shadow"
            >
              {width > 912 ? <span>Settings</span> : ""}
            </IconButton>
          </li>
        </ul>
      ) : (
        " "
        )}
        <div id="flash_container"></div>
    </nav>
  );
};

export default Navbar;
