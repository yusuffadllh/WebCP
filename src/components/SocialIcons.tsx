import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import { useEffect } from "react";
import HoverLinks from "./HoverLinks";
import { config } from "../config";

const SocialIcons = () => {
  useEffect(() => {
    const social = document.getElementById("social") as HTMLElement;
    if (!social) return;

    const cleanups: Array<() => void> = [];

    social.querySelectorAll("span").forEach((item) => {
      const elem = item as HTMLElement;
      const link = elem.querySelector("a") as HTMLElement;
      if (!link) return;

      const onMouseMove = (e: MouseEvent) => {
        const rect = elem.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 40 && x > 10 && y < 40 && y > 5) {
          link.style.setProperty("--siLeft", `${x}px`);
          link.style.setProperty("--siTop", `${y}px`);
        } else {
          link.style.setProperty("--siLeft", `${rect.width / 2}px`);
          link.style.setProperty("--siTop", `${rect.height / 2}px`);
        }
      };

      const onMouseLeave = () => {
        const rect = elem.getBoundingClientRect();
        link.style.setProperty("--siLeft", `${rect.width / 2}px`);
        link.style.setProperty("--siTop", `${rect.height / 2}px`);
      };

      elem.addEventListener("mousemove", onMouseMove);
      elem.addEventListener("mouseleave", onMouseLeave);

      cleanups.push(() => {
        elem.removeEventListener("mousemove", onMouseMove);
        elem.removeEventListener("mouseleave", onMouseLeave);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span>
          <a href={config.contact.github} target="_blank" rel="noopener noreferrer">
            <FaGithub />
          </a>
        </span>
        <span>
          <a href={config.contact.linkedin} target="_blank" rel="noopener noreferrer">
            <FaLinkedinIn />
          </a>
        </span>
        {config.contact.twitter && (
          <span>
            <a href={config.contact.twitter} target="_blank" rel="noopener noreferrer">
              <FaXTwitter />
            </a>
          </span>
        )}
        {config.contact.instagram && (
          <span>
            <a href={config.contact.instagram} target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
          </span>
        )}
      </div>
      <a
        className="resume-button"
        href={config.contact.resume}
        target="_blank"
        rel="noopener noreferrer"
      >
        <HoverLinks text="RESUME" />
        <span>
          <TbNotes />
        </span>
      </a>
    </div>
  );
};

export default SocialIcons;
