Here is the **Web Matcha** subject formatted into clean, structured Markdown. You can copy and paste this entire block directly into your AI's context or knowledge base.

***

# Web Matcha (Project Subject v5.1)

> **Summary:** Because love, too, can be industrialized.

---

## Chapter I: Foreword
This second millennium has forever changed and reinforced the habits and customs of the Internet. Choices are now driven by technology, leaving less and less room for chance. Human relationships, the foundation of any modern society, are increasingly formed artificially through dating site algorithms and social networks, connecting people based on highly specific criteria.

Yes, romanticism is dead, and Victor Hugo is probably rolling in his grave.

---

## Chapter II: Introduction
This project aims to create a dating website. You need to develop an application that facilitates connections between two potential partners, covering the entire process from registration to the final meeting.

Users should be able to:
* Register and log in.
* Complete their profile.
* Search for and view other users’ profiles.
* Express interest in them with a "like".
* Chat with those who have reciprocated their interest.

---

## Chapter III: General Instructions

* **Error Free:** Your application must be free of errors, warnings, or notices, both server-side and client-side.
* **Language:** You are free to use any programming language.
* **Frameworks:** You may use **micro-frameworks** and UI libraries (React, Vue, etc.).
* **Security:** No security vulnerabilities are allowed. Addressing mandatory security requirements is the minimum; going beyond is encouraged.

### The "Micro-Framework" Constraint
> **Definition:** A "micro-framework" is one that includes a router and possibly templating but **does not include an ORM, validators, or a User Account Manager.** This definition is authoritative.

**Suggested Technologies:**
* Flask (Python)
* Express (Node.js)
* Sinatra (Ruby)
* Goji (Golang)
* Spark (Java)
* *Note: Django, Symfony, Rails, or full-stack frameworks with built-in ORMs are generally prohibited based on this definition.*

### Database Constraints
* You must use a relational or graph-oriented database (MySQL, PostgreSQL, Neo4j, etc.).
* **NO ORM Allowed:** You must manually create your queries.
* **Seeding:** Your database must contain a minimum of **500 distinct profiles** for evaluation.

### Layout & Mobile
* Compatible with Firefox and Chrome (latest versions).
* Responsive design (Mobile-friendly).
* Standard layout: Header, Main Section, Footer.

### Security (Mandatory)
Failure to secure the following will result in a score of 0:
* **NO** plain-text passwords in the database.
* **NO** HTML/JS injection (XSS).
* **NO** Unauthorized content uploads.
* **NO** SQL Injection.

---

## Chapter IV: Mandatory Part

### IV.1 Registration and Signing-in
* **Fields:** Email, username, last name, first name, secure password.
* **Validation:** English dictionary words should not be accepted as passwords.
* **Verification:** User receives an email with a unique link to verify the account.
* **Login:** Username + Password.
* **Reset:** "Forgot Password" feature (via email).
* **Logout:** One-click logout from any page.

### IV.2 User Profile
Once logged in, users must populate:
* Gender.
* Sexual preferences.
* Biography.
* **Tags:** List of interests (e.g., #vegan, #geek). Tags must be reusable.
* **Photos:** Up to 5 pictures. One must be the "Profile Picture".
* **Edits:** Users can modify info, email, and password at any time.

**Stats & Location:**
* **Fame Rating:** Publicly visible rating (logic defined by you).
* **Visits:** User sees who viewed their profile.
* **Likes:** User sees who liked them.
* **GPS:** Users are located via GPS (to the neighborhood level).
    * If GPS is denied, approximate location via IP.
    * User can manually modify GPS location in settings.

### IV.3 Browsing (The Matching Algorithm)
Users must see a list of suggested profiles.
* **Orientation Filter:** Heterosexuals see opposite gender; Homosexuals see same gender; Bisexuals see both. (Default = Bisexual).
* **Matching Logic:** Matches must be prioritized based on:
    1.  **Proximity** (Geographical area).
    2.  **Common Tags** (Highest number of shared interests).
    3.  **Fame Rating** (Highest rating).
* **Sorting/Filtering:** The list must be sortable and filterable by Age, Location, Fame Rating, and Tags.

### IV.4 Research (Advanced Search)
Users must be able to run a custom search selecting specific criteria:
* Age range.
* Fame Rating range.
* Location.
* Specific Tags.
* *Results must be sortable/filterable just like the browsing list.*

### IV.5 Profile View
When viewing another user:
* Display all info (except email/password).
* **History:** The visit is added to the viewed user's history.
* **Status:** Show if the user is Online. If offline, show "Last Seen" date/time.
* **Fame:** Show their rating.
* **Relationship:** Clearly show if this user already liked the viewer or if they are "Connected".

**Actions:**
* **Like:** Like the profile picture. (If mutual like = "Connected").
* **Unlike:** Remove like (breaks connection/chat).
* **Block:** User no longer appears in search/notifications. Chat disabled.
* **Report:** Report as "Fake Account".

### IV.6 Chat
* **Condition:** Only available if users are **Connected** (Mutual Like).
* **Real-time:** Messages must appear with < 10s delay.
* **Notifications:** Visible from any page.

### IV.7 Notifications
Real-time notifications (< 10s delay) for:
* Receiving a "Like".
* Profile View.
* Receiving a Message.
* A "Like" returning (Match).
* A connected user "Unliking".
* *Users must see unread notification counts.*

**Development Note:** Store credentials/API keys in a `.env` file. Never commit them to Git.

---

## Chapter V: Bonus Part
(Only evaluated if the Mandatory part is 100% perfect)

1.  **OmniAuth:** Login via Google/Facebook/etc.
2.  **Advanced Images:** Drag-and-drop upload, crop, rotate, filters.
3.  **Interactive Map:** View users on a map (requires precise GPS).
4.  **Video/Audio Call:** WebRTC integration.
5.  **Events:** Schedule real-life dates.

---

## Chapter VI: Peer Evaluation Criteria
* **Zero Tolerance:** Any crash, error, or debug notice (server or client side) fails the project.
* **Security Breach:** Any SQL injection, XSS, or plain-text password storage results in a score of 0.