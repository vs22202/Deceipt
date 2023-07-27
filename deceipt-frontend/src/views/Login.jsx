import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import styles from "./Login.module.css";
import { Icon } from "@iconify/react";
import { googleLoginUser, loginUser, auth, redirectResult,signupUser } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import MutedLink from "../components/MutedLink";
import SubmitButton from "../components/SubmitButton";
import flash_message from "../utils"
import gsap from "gsap";

const Login = () => {
  const navigate = useNavigate();
  const loginFormRef = useRef();
  const illusRef = useRef();
  const desktopDecorationRef = useRef();
  const [width, setWidth] = useState(window.innerWidth);
  const updateWidth = () => setWidth(window.innerWidth);
  const [signup,setSignUp] = useState(false)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("loadingState")) ||false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });
  //window size listener to change navbar 
  useEffect(() => {
    window.addEventListener("resize", updateWidth);
    localStorage.setItem("loadingState","");
    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      redirectResult().then((res) => {
        handleLoginErrors(res);
      });
    });
    return unsubscribe;
  }, []);
  useLayoutEffect(() => {
    gsap
      .to(desktopDecorationRef.current, {
        yPercent: -50,
        repeat: -1,
        duration: 10,
        delay: 5,
        ease: "linear",
      })
      .totalProgress(0.5);
    gsap.set(desktopDecorationRef.current, { yPercent: 0 });
  }, []);
  const handleLoginErrors = (res) => {
    if (res.user) {
      //update global context
      setError("root.loginError", {
        type: res.errorCode,
      });
      localStorage.setItem("loadingState","")
      navigate("/");
    } else {
      setError("root.loginError", {
        type: res.errorCode,
      });
    }
  };
  const handleFormSubmit = (data) => {
    localStorage.setItem("loadingState", true)
    if (signup) { signupUser(data.email, data.password); flash_message("Signup Sucessful", "info") }
    else { loginUser(data.email, data.password); flash_message("Login Sucessful", "info") }
    setSignUp(false)
    
    localStorage.setItem("loadingState", "")
  };
  //animation control
  const handleAnimation = async () => {
    const elements = loginFormRef.current.children;
    gsap.to(illusRef.current, {
      xPercent: -150,
      duration: 1.25,
      ease: "elastic.out(0.6,0.5)",
    });
    gsap.to(elements, {
      xPercent: -150,
      stagger: 0.1,
      delay: 0.1,
      duration: 1.25,
      ease: "elastic.out(0.8,0.5)",
    });
  };
  //signup Animation
  const handleSignUp = () => {
    setSignUp(!signup);
  };
  return (
    <div className={`${styles.loginPage} ${loading? styles.overlay : ""} `}>
      <div className={styles.loginContainer}>
        <img className={styles.cloud} src="src/assets/login-wave.svg" />
        <div className={styles.illus}>
          <img
            src="src/assets/illustrations/login.svg"
            onLoad={handleAnimation}
            ref={illusRef}
          />
        </div>
        <form
          className={styles.loginForm}
          onSubmit={handleSubmit(handleFormSubmit)}
          ref={loginFormRef}
        >
          {signup ? <h3>Sign Up</h3>  : <h3>Login</h3>}
          {errors.root &&
            errors.root.loginError.type?.split("/")[1] === "wrong-password" && (
              <p className={styles.error}>Incorrect Password</p>
            )}
          {errors.root &&
            errors.root.loginError.type?.split("/")[1] === "user-not-found" && (
              <p className={styles.error}>Email Id Not Found</p>
            )}
          <div className={styles.fields}>
            <Input
              name="email"
              placeholder="vishaal.s@gmail.com"
              labelValue="Email Id"
              type="email"
              register={register}
              validationSchema={{
                required: "Email Id is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                  message: "Enter a valid email id",
                },
              }}
              icon={{
                icon: "material-symbols:mail-outline",
                color: "rgba(var(--primary-color),1)",
                width: "35",
              }}
              errors={errors}
              required
            />
            <Input
              name="password"
              type="password"
              placeholder="............"
              labelValue="Password"
              register={register}
              validationSchema={{ required: "Password is required" }}
              icon={{
                icon: "material-symbols:vpn-key-outline-rounded",
                color: "rgba(var(--primary-color),1)",
                width: "35",
              }}
              errors={errors}
              required
            />
          </div>
          <MutedLink
            url="/forgotpassword"
            style={{ marginLeft: "auto", marginTop: "-1em" }}
          >
            forgot password?
          </MutedLink>
          <SubmitButton value={signup ? 'Sign Up' : 'Login'} />
          <div className={styles.verticalDivider}>
            <hr />
            or
            <hr />
          </div>
          <div className={styles.googleBtn}>
            <Icon icon="logos:google-icon" />
            <input
              type="button"
              value={signup ? 'Sign Up With Google' : 'Login With Google'} 
              onClick={async () => {
                localStorage.setItem("loadingState",true)
                googleLoginUser();
              }}
            />
          </div>
          <p className={styles.signUpLink}>
            new to deceipt?{" "}
            <MutedLink url="#" onClick={handleSignUp}>
            {signup ? 'Login' : 'Sign Up'}
            </MutedLink>
          </p>
        </form>
      </div>
      {width >= 1024 && (
        <div className={styles.company}>
          {" "}
          <a href="/">
            <img src="src/assets/Logo.svg" alt="Logo" className={styles.logo} />
          </a>
          <p>A one-stop Solution for all your receipt and expense management</p>
        </div>
      )}
      {width >= 1024 && (
        <div className={styles.desktopDecoration} ref={desktopDecorationRef}>
          <div className={styles.illustrationGrid}>
            <div>
              <img src="src/assets/illustrations/login-desktop-receipt.svg" />
            </div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div>
              <img src="src/assets/illustrations/login-desktop-reports.svg" />
            </div>
            <div></div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div>
              <img src="src/assets/illustrations/login-desktop-finance.svg" />
            </div>
            <div>
              <img src="src/assets/illustrations/login-desktop-investing.svg" />
            </div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div></div>
          </div>
          <div className={styles.illustrationGrid}>
            <div>
              <img src="src/assets/illustrations/login-desktop-receipt.svg" />
            </div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div>
              <img src="src/assets/illustrations/login-desktop-reports.svg" />
            </div>
            <div></div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div>
              <img src="src/assets/illustrations/login-desktop-finance.svg" />
            </div>
            <div>
              <img src="src/assets/illustrations/login-desktop-investing.svg" />
            </div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div></div>
          </div>
          <div className={styles.illustrationGrid}>
            <div>
              <img src="src/assets/illustrations/login-desktop-receipt.svg" />
            </div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div>
              <img src="src/assets/illustrations/login-desktop-reports.svg" />
            </div>
            <div></div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div>
              <img src="src/assets/illustrations/login-desktop-finance.svg" />
            </div>
            <div>
              <img src="src/assets/illustrations/login-desktop-investing.svg" />
            </div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div></div>
          </div>
          <div className={styles.illustrationGrid}>
            <div>
              <img src="src/assets/illustrations/login-desktop-receipt.svg" />
            </div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div>
              <img src="src/assets/illustrations/login-desktop-reports.svg" />
            </div>
            <div></div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div>
              <img src="src/assets/illustrations/login-desktop-finance.svg" />
            </div>
            <div>
              <img src="src/assets/illustrations/login-desktop-investing.svg" />
            </div>
            <hr className={styles.vertical} />
            <div></div>
            <hr className={styles.vertical} />
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
