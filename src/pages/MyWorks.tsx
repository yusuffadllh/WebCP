import { useState } from "react";
import { Link } from "react-router-dom";
import { config } from "../config";
import "./MyWorks.css";

const MyWorks = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="myworks-page">
      <div className="myworks-header">
        <Link
          to="/"
          className="back-button"
          data-cursor="disable"
          onClick={() => sessionStorage.setItem("fromMyWorks", "true")}
        >
          ← Back to Home
        </Link>
        <h1>
          All <span>Works</span>
        </h1>
        <p>A collection of all my projects and creations</p>
      </div>

      <div className="myworks-grid">
        {config.projects.map((project, index) => (
          <div className="myworks-card" key={project.id} data-cursor="disable">
            <div className="myworks-card-number">0{index + 1}</div>
            <div
              className="myworks-card-image"
              onClick={() => setSelectedImage(project.image)}
              style={{ cursor: 'zoom-in' }}
            >
              <img src={project.image} alt={project.title} />
              <div className="image-overlay">
                <span>🔍 Click to View</span>
              </div>
            </div>
            <div className="myworks-card-info">
              <h3>{project.title}</h3>
              <p className="myworks-card-category">{project.category}</p>
              <p className="myworks-card-description">{project.description}</p>
              <p className="myworks-card-tech">{project.technologies}</p>
              {project.link && (
                <a
                  className="myworks-card-link"
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lihat di GitHub →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / Image Magnifier Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage} alt="Work detail" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyWorks;
