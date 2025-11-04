# **Best Krazy Chicken (BKC) — Personal Website Project**

### **Author:** José Efraín Castro Castillo  
### **Course:** Business Information Technology — University of Salford  
### **Module:** Web Application Development (Level 5)  
### **Lecturer:** Ms. Kate Han  
### **Deployment:** [Live Website (Vercel)](https://bsn038-github-io.vercel.app/)  
### **Repository:** [GitHub Source Code](https://github.com/BSN038/bsn038.github.io)

---

## **Project Overview**
This website was developed as part of the *Web Application Development* module assessment.  
It represents the digital transformation of **Best Krazy Chicken (BKC)** — a fictional Colombian-inspired restaurant brand.  
The prototype demonstrates a professional approach to web design, combining creativity, functionality, and modern front-end practices.

The site was built using **hand-coded HTML5, CSS3, and JavaScript**, with all pages passing **W3C validation**.  
Deployment and version control were handled via **GitHub** and **Vercel**.

---

## **Key Features**
- Responsive, mobile-first layout using CSS Grid and flexible containers.  
- Consistent color palette, typography, and accessible navigation.  
- Accordion-style menu and interactive UI elements for improved UX.  
- Multi-step checkout simulation with credit card preview (Problem-Solving section).  
- Optimized images and BKC logo watermark integration.  
- Accessible focus states and semantic structure for screen readers.  
- Validation of HTML and CSS (100% W3C compliant).  
- Integration of a **custom AI Assistant** powered by local JSON data and Netlify Functions.  
- Fixed and improved **contact form** validation and success message feedback.  

---

## **AI Assistant Integration**
A new feature — **BKC AI Assistant** — was developed to simulate real-time user interaction.  
It uses:
- A local knowledge base (`/kb/site.json`)  
- A custom Netlify serverless function (`/netlify/functions/ask.js`)  
- JavaScript integration in `js/script.js` and `index.html`  

This assistant can answer questions about the restaurant concept, skills, and project details directly on the website.

**Note:**  
Before implementing these advanced features, I consulted my lecturer (Ms. Kate Han), who confirmed that extending the project was acceptable as long as the original five-page structure and learning outcomes were preserved.  
All additional files were built manually using JavaScript and JSON within the project’s academic framework.

---

## **Design Choices**
The design follows a warm, friendly theme inspired by BKC’s Colombian roots.  
Rounded corners, clear spacing, and color contrast improve usability and readability.  
A consistent grid-based layout ensures that all five pages maintain visual harmony across desktop and mobile devices.

---

## 📱 Mobile Accessibility Feature

The website includes a **mobile-friendly bottom navigation bar** designed to support accessibility and usability on small screens.  
This ensures that users — including those with limited mobility — can easily navigate between key pages using thumb reach.

### Preview (Mobile Device)
![Mobile bottom navigation accessibility example](/docs/mobile-bottom-nav-accessibility.png)

---

## **Accessibility Enhancement: Mobile Bottom Navigation**

To improve usability and accessibility — especially for users with motor impairments or limited screen navigation ability — a fixed **bottom navigation bar** was implemented on mobile devices only.

Using CSS media queries, the navigation bar is displayed at the bottom of the viewport when the screen width is below a specific threshold. This design ensures that all key pages remain reachable with minimal finger movement on smartphones.

The buttons are circular, touch-friendly, and have clear text labels and high contrast for better visibility. The layout enhances **thumb reachability**, **screen reader compatibility**, and aligns with **WCAG** and **mobile-first UX principles**.

---

## **Technical Summary**
- **HTML5:** Semantic structure and accessibility attributes.  
- **CSS3:** Custom variables, responsive grid, and media queries.  
- **JavaScript (ES6):** Interactive logic for menus, animations, and form validation.  
- **Form Handling:** Managed via Formspree (secure and backend-free).  
- **Netlify Functions:** Used for serverless AI Assistant communication.  
- **Deployment:** Hosted on **Vercel**, automatically synced with GitHub.  

---

## **Validation Results**
- **HTML:** ✅ Passed with no errors or warnings using [W3C Validator](https://validator.w3.org/).  
- **CSS:** ✅ Passed with no errors using [W3C CSS Validator](https://jigsaw.w3.org/css-validator/).  
  Minor warnings only relate to modern CSS variables (acceptable practice).  
- Screenshots stored under `/docs/validation/` for verification.

---

## **Generative AI Usage Statement**
I used **ChatGPT (OpenAI)** as a personal learning partner and technical assistant throughout this project.  
It helped me understand web technologies, debug errors efficiently, and implement advanced features such as the BKC AI Assistant and Netlify serverless functions.

Before adding new components, I discussed the idea with my lecturer, Ms. Kate Han, who approved the extension as part of advanced experimentation within the same assessment scope.  
Together with ChatGPT, I successfully created additional files like `ask.js` and `site.json`, ensuring full academic transparency and independent implementation.

ChatGPT assisted me with:
- Improving the organisation and consistency of my CSS structure.  
- Understanding the role of `<script defer>` and JSON-LD for performance and SEO.  
- Checking and fixing heading consistency (H1–H3) across pages.  
- Interpreting HTML and CSS validator feedback safely.  
- Receiving guidance on UX, accessibility, and documentation style.

All final content, code, and design decisions were made independently.  
ChatGPT acted as an **instant personal tutor**, helping me learn faster, debug logically, and make better design decisions.  
This collaboration demonstrates how human creativity and AI guidance can work together to produce professional-quality results efficiently.

---

## **Reflection and Conclusion**
This project demonstrates my ability to design, code, validate, and deploy a professional web prototype from scratch.  
The process strengthened my understanding of responsive design, semantic structure, accessibility, and client-focused presentation.  

I spent many hours identifying and resolving technical issues — especially while implementing the AI Assistant and Netlify functions.  
Through persistence and collaboration with AI, I learned that teamwork between human insight and intelligent guidance leads to faster learning, better debugging, and high-quality output.  

Overall, this project not only meets all academic requirements but also extends them by showcasing innovation, problem-solving, and modern web development practices.

---

### **Validation Evidence**
All pages and stylesheets successfully validated (October 2025):  
- **HTML Validation:** [W3C Markup Validation Service](https://validator.w3.org/)  
- **CSS Validation:** [W3C CSS Validation Service](https://jigsaw.w3.org/css-validator/)  

✅ Stored in `/docs/validation/` as:                HTML_ValidationScreenshotFinal.png
CSS_ValidationScreenshotFinal.png

---

### **Live Links**
- 🌐 **Main Deployment (Vercel):** [https://bsn038-github-io.vercel.app/](https://bsn038-github-io.vercel.app/)  
- 💻 **GitHub Repository:** [https://github.com/BSN038/bsn038.github.io](https://github.com/BSN038/bsn038.github.io)
