/*
 * T sign User Guide content, built from "T sign_User_Guide_Finalised.docx" (Release v1.39.0).
 * Edit the text here; tSignUserGuide renders it. Screenshots live in the tSignUserGuideImages static resource
 * (img/fig<N>.jpg, N = the figure number in the Word guide).
 *
 * Text: **bold**, [link text](topicId) or [link text](topicId#sectionId).
 * Blocks: { p }, { steps: [] }, { bullets: [] }, { h }, { img, caption }, { table: [[header...], [row...]] },
 *         { chips: [], label }, { note }, { warning }, { tip, title }.
 * Account type: add businessOnly: true or individualOnly: true to a block to show it to only that account type.
 */

export const GUIDE_UPDATED = "10 Nov 2026";
export const GUIDE_RELEASE = "v1.39.0";
export const SUPPORT_EMAIL = "support@tsignapp.com";
export const SUPPORT_URL = "https://tsignapp.com/contact";

export const GROUPS = [
  { id: "start", label: "Getting started" },
  { id: "setup", label: "Set up your account" },
  { id: "send", label: "Send and track" },
  { id: "signing", label: "Signing" }
];

// Popular chips on the guide home: [label, topicId#sectionId]
export const POPULAR = [
  ["Create a signature", "profile#create-a-signature"],
  ["Send a document", "send"],
  ["Add a contact", "contacts#create-a-contact"],
  ["Set the signing order", "send#add-recipients-and-set-the-signing-order"],
  ["Signing link expired", "sign#receive-the-email"]
];

// "How signing works" on the guide home
// export const STAGES = [
//   { title: "Prepare and send", who: "Sender", text: "Upload, choose the type, add recipients, place fields and send.", status: "Waiting for others", tone: "blue" },
//   { title: "Receive email", who: "Recipient", text: "An \u201cAction Required\u201d email arrives with a secure signing link.", status: "Pending", tone: "amber" },
//   { title: "Sign", who: "Recipient", text: "Open the document, fill in the fields, sign and submit.", status: "Pending", tone: "amber" },
//   { title: "Complete", who: "T sign", text: "The signed PDF is created and a confirmation email is sent.", status: "Completed", tone: "green" }
// ];

export const STAGES = [
  { title: "Prepare and send", who: "Sender", text: "Upload, choose the type, add recipients, place fields and send." },
  { title: "Receive email", who: "Recipient", text: "An \u201cAction Required\u201d email arrives with a secure signing link." },
  { title: "Sign", who: "Recipient", text: "Open the document, fill in the fields, sign and submit." },
  { title: "Complete", who: "T sign", text: "The signed PDF is created and a confirmation email is sent." }
];

// "Set up before you send" checklist. key = field in TSignUserGuideController.SetupProgress,
// module = Module_Access__c value that must be present (blank = always), link = article to open.
export const CHECKLIST = [
  { key: "signature", label: "Create your signature", module: "My Profile", link: "profile#create-a-signature" },
  { key: "users", label: "Add users and facilities", module: "My Organisation", link: "organisation#user-management", businessOnly: true },
  { key: "contacts", label: "Add your contacts", module: "Contact", link: "contacts#create-a-contact" },
  { key: "templates", label: "Create templates", module: "Templates", link: "templates#create-a-template-from-scratch" },
  { key: "folders", label: "Store files in Folders", module: "Folders", link: "folders#add-an-attachment" }
];

// Suggestions under "Can't find it?" on the search page
export const TRY_SEARCHING = ["signing order", "custom field", "archive", "default signature"];

export const TOPICS = [
  {
    id: "overview",
    group: "start",
    icon: "rocket_launch",
    title: "Overview",
    summary: "What T sign is, who uses it and how signing works.",
    audience: ["Account owners", "Senders", "Recipients"],
    related: ["sign-up", "send", "dashboard"],
    intro: [
      {
        p: "**T sign** is an electronic signature application by Tesseract Apps. You use it to send documents for signature, track each request, and store the signed copy in one place. Typical documents include service agreements, consent and authorisation forms, contracts and legal documents."
      },
      {
        p: "Individuals and organisations subscribe to T sign through the T sign website, starting with a free 7-day trial. Every document is timestamped, and each signing event is logged, so you can always see what is outstanding, who it is waiting on, and what has been completed. Recipients sign from a secure link in their email, so they do not need a T sign login."
      }
    ],
    sections: [
      {
        id: "who-uses-t-sign",
        title: "Who uses T sign",
        blocks: [
          {
            bullets: [
              "**Account owners:** the person who signs up, either for themselves (Individual) or for their organisation (Business), where they become the primary contact.",
              "**Senders:** Org Admins, Coordinators and HR staff who send documents to clients, partners, suppliers or staff.",
              "**Recipients:** anyone asked to sign a document. Recipients sign through the emailed link."
            ]
          }
        ]
      },
      {
        id: "getting-there",
        title: "Getting there",
        blocks: [
          {
            p: "Log in to T sign (see [Log in](sign-up#log-in)). Select **T sign** from the left-hand navigation menu to open the T sign dashboard."
          }
        ]
      },
      {
        id: "the-signing-process-at-a-glance",
        title: "The signing process at a glance",
        blocks: [
          {
            table: [
              ["**Stage**", "**Who**", "**What happens**", "**Status**"],
              [
                "Sign up (first time only)",
                "Account owner",
                "Start a free trial on the T sign website, add payment details and activate the account.",
                "Free Trial"
              ],
              [
                "1. Prepare and send",
                "Sender",
                "Upload the document, choose the type, add recipients, place fields and send.",
                "Waiting for others"
              ],
              [
                "2. Receive email",
                "Recipient",
                "An \"Action Required\" email arrives with a secure signing link.",
                "Pending"
              ],
              [
                "3. Sign",
                "Recipient",
                "Open the document, complete the fields, add a signature and submit.",
                "Pending"
              ],
              [
                "4. Complete",
                "System",
                "The signed PDF is generated and a confirmation email is sent.",
                "Completed"
              ]
            ]
          }
        ]
      }
    ]
  },
  {
    id: "sign-up",
    group: "start",
    icon: "person_add",
    title: "Sign up and log in",
    summary: "Start a free trial, add payment details, activate your account and log in.",
    audience: ["Account owners"],
    related: ["profile", "organisation", "overview"],
    intro: [
      {
        p: "Before you can use T sign, you sign up on the T sign website. There are two account types: **Individual**, for one person, and **Business**, for organisations with several users. Every plan starts with a free 7-day trial."
      },
      {
        note: "You add payment details during sign-up, but you are not charged until the 7-day trial ends."
      }
    ],
    sections: [
      {
        id: "start-your-free-trial",
        title: "Start your free trial",
        blocks: [
          {
            steps: [
              "Go to the T sign website.",
              "Click **Start Free 7-Day Trial** at the top right of any page.",
              "The **Start your free 7-day trial** page opens."
            ]
          },
          {
            p: "Already have an account? Click **Sign In** instead."
          },
          {
            img: 1,
            caption: "Start your free 7-day trial page"
          }
        ]
      },
      {
        id: "choose-your-account",
        title: "Choose your account",
        blocks: [
          {
            p: "Under **Choose your account**, use the toggle to pick **Monthly** or **Yearly** billing. Yearly billing saves 18%. Prices include GST and are charged in the currency of your billing country."
          },
          {
            table: [
              ["", "**Individual**", "**Business**"],
              [
                "**Best for**",
                "People who want a simple way to prepare, sign, send and track documents.",
                "Teams and organisations that need more visibility and control."
              ],
              [
                "**Price (yearly billing)**",
                "A$13.50 per month, billed A$162 yearly",
                "A$18 per user per month, billed A$216 per user yearly"
              ],
              ["**Users**", "One user", "Multiple organisation users, from 2 to 500"],
              [
                "**Includes**",
                "Free 7-day trial; signing and sending; multiple recipients; templates and contacts; tracking and reminders; completion records; no document limits on the paid plan",
                "Everything in Individual, plus user management; contacts and reusable templates; tracking and reminders; reports (available after upgrade); no document limits on the paid plan"
              ]
            ]
          },
          {
            p: "Click **Start 7-day free trial** under the plan you want. A sign-up form opens. Follow [Sign up for a Business account](sign-up#sign-up-for-a-business-account) for a Business account or [Sign up for an Individual account](sign-up#sign-up-for-an-individual-account) for an Individual account."
          },
          {
            img: 2,
            caption: "Individual and Business plans (prices in AUD)"
          }
        ]
      },
      {
        id: "sign-up-for-a-business-account",
        title: "Sign up for a Business account",
        blocks: [
          {
            p: "The top of the **Business** form confirms the price and billing, and that you will add payment details on the next step through the secure Stripe payment gateway. Scroll down to complete each section."
          },
          {
            h: "Team"
          },
          {
            p: "Enter the **Team size**, which is the number of users. The total is calculated beside it, for example **2 users × A$18 = A$36 / month**."
          },
          {
            h: "Organisation"
          },
          {
            table: [
              ["**Field**", "**What to enter**"],
              ["**Legal name**", "Your organisation's registered legal name."],
              ["**Trading name** (optional)", "The name you trade under, if different."],
              [
                "**Business type**",
                "Choose one: Sole trader, Partnership, Company, Trust, Non-profit or charity, Government body, or Other."
              ]
            ]
          },
          {
            img: 3,
            caption: "Business form: Team and Organisation sections"
          },
          {
            h: "Primary contact and email verification"
          },
          {
            steps: [
              "Enter your **First name** and **Last name**.",
              "Enter your **Work email** and click **Send code**.",
              "T sign emails you a six-digit verification code. The code expires in 10 minutes.",
              "Enter the code in the box that appears under the email and click **Verify**. When it is accepted, **Email verified.** appears under the email with a green tick.",
              "Enter your **Mobile** number. The country code is shown at the start of the field."
            ]
          },
          {
            img: 4,
            caption: "Primary Contact section with Send code"
          },
          {
            img: 5,
            caption: "Verification code email"
          },
          {
            img: 6,
            caption: "Email verified, with the Billing Address section below"
          },
          {
            h: "Billing address"
          },
          {
            p: "Choose your **Country**, then enter your **Street address**, **Apartment, suite or floor** (optional), **Suburb**, **State or territory** and **Postcode**. The country you choose sets the currency you are billed in."
          },
          {
            img: 7,
            caption: "Billing address"
          },
          {
            h: "Registration and tax"
          },
          {
            p: "For Australian organisations, enter your **ABN** and **ACN**."
          },
          {
            h: "Confirm and continue"
          },
          {
            steps: [
              "Tick the box to confirm you are authorised to act for the organisation and agree to the **Terms of Service** and **Privacy Policy**.",
              "Click **Start 7-day free trial**. To leave without signing up, click **Cancel**. Then continue with [Add payment details](sign-up#add-payment-details)."
            ]
          },
          {
            img: 8,
            caption: "Registration and tax details with the authorisation checkbox ticked"
          }
        ]
      },
      {
        id: "sign-up-for-an-individual-account",
        title: "Sign up for an Individual account",
        blocks: [
          {
            p: "The **Individual** form is shorter: there is no team, organisation or tax section. The top of the form confirms the price and billing. Fields marked with a red asterisk (*) are mandatory."
          },
          {
            h: "Your details and email verification"
          },
          {
            steps: [
              "Enter your **First name** and **Last name**.",
              "Enter your **Email**. T sign sends a six-digit code to that address, and a panel appears under the email: \"We sent a 6-digit code to … It expires in 10 minutes.\"",
              "Open the **T sign verification code** email, enter the code in the panel and click **Verify**.",
              "If the email does not arrive, wait for the countdown on the button beside the email (for example **Resend in 19s**) to finish, then click it to send a new code.",
              "When the code is accepted, **Email verified.** appears under the email with a green tick.",
              "Enter your **Mobile** number."
            ]
          },
          {
            img: 9,
            caption: "Individual form with the verification code panel"
          },
          {
            img: 10,
            caption: "Verification code email"
          },
          {
            img: 11,
            caption: "Email verified, with the Billing Address section below"
          },
          {
            h: "Billing address"
          },
          {
            steps: [
              "Check the **Country**. It is set from your location. If it is wrong, click **contact us**.",
              "Enter your **Street address**, **Apartment, suite or floor** (optional), **Suburb**, **State or territory** and **Postcode**.",
              "Tick the box to agree to the **Terms and Conditions** and **Privacy Policy**. This is mandatory.",
              "Click **Start 7-day free trial**, then continue with [Add payment details](sign-up#add-payment-details)."
            ]
          },
          {
            img: 12,
            caption: "Billing address and agreement checkbox"
          }
        ]
      },
      {
        id: "add-payment-details",
        title: "Add payment details",
        blocks: [
          {
            p: "For both account types, you are taken to the secure Stripe checkout page."
          },
          {
            bullets: [
              "The left side summarises your plan: **7 days free**, the yearly price after the trial and the date it starts, and **Total due today**, which is **A$0.00** during the trial. A Business account also shows the number of users (Qty).",
              "Click **Add promotion code** if you have one.",
              "On the right, check your email and phone number, then choose a payment method. You can pay by **Card**, **Apple Pay**, **Link** or **Klarna**.",
              "For a card, enter the card number, expiry date, security code (CVC), cardholder name and country.",
              "Optionally tick **Save my information for faster checkout**."
            ]
          },
          {
            p: "Click **Start trial**."
          },
          {
            img: 13,
            caption: "Stripe checkout for a Business account with 2 users"
          },
          {
            img: 14,
            caption: "Stripe checkout for an Individual account"
          }
        ]
      },
      {
        id: "your-free-trial-has-started",
        title: "Your free trial has started",
        blocks: [
          {
            p: "A confirmation page shows the date your trial is active until. You will not be charged before then. Your login details are sent to the email you entered. A **Billing** link is also added to the website menu."
          },
          {
            table: [
              ["**Option**", "**What it does**"],
              [
                "**Manage billing**",
                "Opens your billing details, where you can view or change your subscription and payment method."
              ],
              ["**Back to pricing**", "Returns to the plans page."],
              ["**Go to home**", "Returns to the T sign website home page."]
            ]
          },
          {
            img: 15,
            caption: "Your free trial has started"
          }
        ]
      },
      {
        id: "activate-your-account-and-set-a-password",
        title: "Activate your account and set a password",
        blocks: [
          {
            steps: [
              "Open the **Welcome to T sign – Activate Your Account** email. It greets you by name and shows your username, which is the email you signed up with.",
              "Click **Activate Your T sign Account**.",
              "On the **Change Your Password** page, enter a **New Password** and enter it again in **Confirm New Password**. The password must have at least 8 characters, 1 letter and 1 number.",
              "Click **Change Password**."
            ]
          },
          {
            note: "The activation link expires in 7 days. If you have questions, contact support@tsignapp.com."
          },
          {
            img: 16,
            caption: "Welcome email with the Activate Your T sign Account button"
          },
          {
            img: 17,
            caption: "Change Your Password page"
          }
        ]
      },
      {
        id: "log-in",
        title: "Log in",
        blocks: [
          {
            p: "To log in at any time, go to **tsignapp.com**, click **Log in**, and enter your T sign username and password. After you log in, the T sign dashboard opens. A new account starts with every count at 0 and no recent activity."
          },
          {
            p: "The top bar shows:"
          },
          {
            bullets: [
              "A greeting with your name.",
              "The account name in the centre: your organisation for a Business account, or your own name for an Individual account.",
              "Your subscription status, for example **Free Trial** and **7 Days Remaining**. Click **Upgrade** to move to a paid plan.",
              "The power icon to log out."
            ]
          },
          {
            h: "Business account"
          },
          {
            p: "The left-hand menu is headed with your organisation name and contains:"
          },
          {
            chips: ["T sign", "Folders", "My Organisation", "My Profile", "Templates", "Contacts", "Reports"],
            label: "Menu item"
          },
          {
            img: 18,
            caption: "Business account dashboard on first login"
          },
          {
            h: "Individual account"
          },
          {
            p: "The left-hand menu is headed with your own name. It has the same items as a Business account except **My Organisation**, because an Individual account has no organisation, facilities or other users to manage."
          },
          {
            chips: ["T sign", "Folders", "My Profile", "Templates", "Contacts", "Reports"],
            label: "Menu item"
          },
          {
            img: 19,
            caption: "Individual account dashboard on first login"
          },
          {
            p: "Before sending documents, we recommend you set up your signature ([My Profile and Signatures](profile)), add your users and facilities if you have a Business account ([My Organisation](organisation)), add the contacts you work with ([Contacts](contacts)), create templates for documents you send often ([Templates](templates)), and store the files you need in Folders ([Folders](folders))."
          }
        ]
      }
    ]
  },
  {
    id: "profile",
    group: "setup",
    icon: "signature",
    title: "My Profile and Signatures",
    summary: "See your details, and create, edit or set a default signature.",
    audience: ["Account owners", "Senders"],
    related: ["send", "sign", "organisation"],
    intro: [
      {
        p: "Select **My Profile** from the left-hand menu to see your own details and manage your signatures. The page has two tabs: **My Profile** and **Signature**."
      }
    ],
    sections: [
      {
        id: "my-profile-tab",
        title: "My Profile tab",
        blocks: [
          {
            p: "The top of the tab shows your initials, your user name and your status, for example **Active**. On the right is the date you became active and your billing, for example **Active since 4 November 2026 · Yearly billing in AUD**. Click **Edit** at the top right to update your details."
          },
          {
            table: [
              ["**Section**", "**What it shows**"],
              [
                "**Personal details**",
                "First Name, Last Name, Email ID, Contact, Address and Country."
              ],
              [
                "**Subscription**",
                "Account type (for example Organisation), Status, Start date, Next billing date, Billing currency and Billing frequency."
              ],
              [
                "**Billing information**",
                "Billing contact, Billing email, Billing address and Tax information. Tax information is stored securely and is not displayed."
              ],
              [
                "**Payment history and Invoice**",
                "One row per invoice, with the Invoice No., Date Issued, Subscription Start Date, Subscription End Date and Amount. Click the eye icon to view an invoice."
              ]
            ]
          },
          {
            img: 20,
            caption: "My Profile tab"
          }
        ]
      },
      {
        id: "create-a-signature",
        title: "Create a signature",
        blocks: [
          {
            p: "Saving a signature in advance speeds up signing documents later. Open the **Signature** tab. **My Signatures** shows how many signatures you have saved. If you have none yet, the page shows **No signatures yet**."
          },
          {
            steps: [
              "Click **Add Signature** at the top right, or **Create your first signature**. The **Create Your Signature** window opens.",
              "Enter your **Full Name** and **Initials**. Both are required.",
              "Choose how to create the signature using one of the three tabs: **Choose**, **Draw** or **Upload** (see the table below).",
              "Read the statement at the bottom. By clicking **Create**, you agree that the signature and initials will be the electronic representation of your signature and initials, including on legally binding contracts.",
              "Click **Create** to save the signature, or **Cancel** to close without saving."
            ]
          },
          {
            img: 21,
            caption: "Signature tab with no saved signatures"
          },
          {
            table: [
              ["**Tab**", "**How it works**"],
              [
                "**Choose**",
                "Pick one of the ready-made styles, which show your full name and initials, for example \"Chris Evans . CH\". Select the style you want with its radio button. Scroll to see more styles."
              ],
              [
                "**Draw**",
                "Draw your signature in the box using your mouse or touch screen. Click **Clear** to start again."
              ],
              [
                "**Upload**",
                "Click **Choose File** and select a PNG or JPG image of your signature. **Create** is available once a file is chosen."
              ]
            ]
          },
          {
            img: 22,
            caption: "Create Your Signature: Choose tab"
          },
          {
            img: 23,
            caption: "Create Your Signature: Draw tab"
          },
          {
            img: 24,
            caption: "Create Your Signature: Upload tab"
          }
        ]
      },
      {
        id: "manage-your-signatures-and-set-a-default",
        title: "Manage your signatures and set a default",
        blocks: [
          {
            p: "Each saved signature is listed with a preview, its name, how it was created (**Type**, **Draw** or **Upload**) and the date. One signature is marked **DEFAULT**."
          },
          {
            bullets: [
              "**Edit** changes a saved signature.",
              "**Set Default** makes that signature your default.",
              "**Delete** removes a signature."
            ]
          },
          {
            p: "Your **default signature is shown beside your name** in the top bar on every page, for example \"Hi, Tesseract Apps\" followed by the signature."
          },
          {
            img: 25,
            caption: "Saved signatures, with the default signature shown beside the user name in the top bar"
          }
        ]
      }
    ]
  },
  {
    id: "organisation",
    group: "setup",
    icon: "domain",
    title: "My Organisation",
    businessOnly: true,
    summary: "Organisation details, facilities and the users who can use T sign.",
    audience: ["Account owners"],
    related: ["profile", "contacts", "sign-up"],
    intro: [
      {
        p: "Select **My Organisation** from the left-hand menu to manage your organisation. The page has three tabs: **Organisation Details**, **Facilities** and **User Management**."
      }
    ],
    sections: [
      {
        id: "organisation-details",
        title: "Organisation Details",
        blocks: [
          {
            p: "This tab shows the **Organisation Subscription Details** captured when you signed up. The top shows the organisation name and status, and on the right the date it became active and the billing, for example **Active since 04/11/2026 · Yearly billing in Australia**. Click **Edit** at the top right to update the details."
          },
          {
            table: [
              ["**Section**", "**What it shows**"],
              [
                "**Organisation details**",
                "Email, Phone, Legal organisation name, Business type, Market, ABN, ACN and Address."
              ],
              [
                "**Primary contact**",
                "First name, Last name, Email and Phone of the person who signed up."
              ],
              [
                "**Subscription**",
                "Account type, Status, Start date, End date and Billing frequency. Click **View Details** under **Your current plan** to see the plan."
              ],
              [
                "**Billing information**",
                "Billing email, Billing phone and Billing address."
              ],
              [
                "**Payment history and Invoice**",
                "The organisation's invoices, as on the My Profile tab."
              ]
            ]
          },
          {
            img: 26,
            caption: "Organisation Details tab"
          }
        ]
      },
      {
        id: "facilities",
        title: "Facilities",
        blocks: [
          {
            p: "Facilities are your organisation's sites or locations. The **Facilities** tab lists them with their **Facility Name**, **Contact Phone**, **Contact Email**, **Location** and **Created On** date. A facility for your organisation, using its sign-up address, is created automatically when you sign up."
          },
          {
            bullets: [
              "Use **Search Facilities** to find a facility.",
              "Click the edit icon in the **Action** column to change a facility.",
              "Use **Page Size** and the **First / Previous / Next / Last** buttons to move through long lists."
            ]
          },
          {
            img: 27,
            caption: "Facilities tab"
          },
          {
            h: "Create a facility"
          },
          {
            steps: [
              "Click **Create Facility** at the top right. The **Create Facility** window opens.",
              "Under **Facility Details**, enter the **Facility Name** and **Contact Email** (both required) and the **Contact Phone**.",
              "Under **Address**, type in **Search Address** to find the address, or fill in the fields yourself: **Country**, **Street**, **City**, **State/Province** and **Postal Code**. All are required.",
              "Click **Create**. To close without saving, click **Cancel**."
            ]
          },
          {
            img: 28,
            caption: "Create Facility window"
          }
        ]
      },
      {
        id: "user-management",
        title: "User Management",
        blocks: [
          {
            p: "The **User Management** tab lists everyone in your organisation who can use T sign. The badge at the top right shows how many users have been created out of the number your subscription allows, for example **1 of 2 Users Created**."
          },
          {
            table: [
              ["**Column**", "**What it shows**"],
              ["**Profile Pic**", "The user's profile picture, or their initials."],
              ["**Name**, **Email Address**, **Contact Number**", "The user's details."],
              [
                "**Access Level**",
                "Click **Grant Access** to set what the user can access."
              ],
              [
                "**Facility Level**",
                "Click **Facility Access** to set which facilities the user can access."
              ],
              [
                "**Reset Password**",
                "Click **Reset Password** to reset the user's password."
              ],
              ["**Created Date**", "When the user was added."],
              ["**Status**", "Whether the user is **Active**."],
              ["**Action**", "Click the edit icon to change the user's details."]
            ]
          },
          {
            bullets: ["Use **Search by Name, Email…** to find a user."]
          },
          {
            img: 29,
            caption: "User Management tab"
          },
          {
            h: "Create a user"
          },
          {
            steps: [
              "Click **Create User** at the top right. The **User Details** window opens.",
              "Enter the **First Name**, **Last Name** and **Phone Number** (all required). The **Username** is the user's email address.",
              "Choose a **Facility** and a **User Type** (required), for example **T sign Org Admin**.",
              "Use the **Status** toggle to make the user active or inactive.",
              "Optionally click **Profile Picture (Max 1MB)** to add a photo.",
              "Under **Address**, search for the address or fill in **Country**, **Street**, **City**, **State/Province** and **Postal Code**. All are required.",
              "Click **Create**. To close without saving, click **Cancel**."
            ]
          },
          {
            note: "You can only create as many users as your subscription allows. To add more, increase your team size or upgrade your plan."
          },
          {
            img: 30,
            caption: "User Details window"
          }
        ]
      }
    ]
  },
  {
    id: "contacts",
    group: "setup",
    icon: "contact_page",
    title: "Contacts",
    summary: "Keep a list of the clients, partners, suppliers and staff you work with.",
    audience: ["Senders"],
    related: ["templates", "send", "folders"],
    intro: [
      {
        p: "Use **Contacts** to keep a list of the people your organisation regularly works with, such as clients, partners, suppliers and staff. Select **Contacts** from the left-hand menu."
      }
    ],
    sections: [
      {
        id: "the-contacts-list",
        title: "The Contacts list",
        blocks: [
          {
            p: "The list shows each contact with these columns:"
          },
          {
            businessOnly: true,
            table: [
              ["**Column**", "**What it shows**"],
              ["**Profile Pic**", "The contact's profile picture, or their initials."],
              ["**Name**, **Email ID**, **Contact Number**", "The contact's details."],
              [
                "**Contact Type**",
                "The type of contact, for example Client, Partner, Supplier or Staff."
              ],
              ["**Facility**", "The facility the contact belongs to."],
              ["**Created Date**", "When the contact was added."],
              [
                "**Action**",
                "The edit icon changes the contact's details. The archive icon moves the contact to Archived Contacts."
              ]
            ]
          },
          {
            individualOnly: true,
            table: [
              ["**Column**", "**What it shows**"],
              ["**Profile Pic**", "The contact's profile picture, or their initials."],
              ["**Name**, **Email ID**, **Contact Number**", "The contact's details."],
              ["**Created Date**", "When the contact was added."],
              [
                "**Action**",
                "The edit icon changes the contact's details. The archive icon moves the contact to Archived Contacts."
              ]
            ]
          },
          {
            bullets: [
              "Use **Search contacts** to find a contact.",
              "Use **Page Size** and the **First / Previous / Next / Last** buttons to move through long lists. **Total Records** shows the full count.",
              "When you have no contacts yet, the list reads **No records found**."
            ]
          },
          {
            businessOnly: true,
            img: 31,
            caption: "Contacts list"
          }
        ]
      },
      {
        id: "create-a-contact",
        title: "Create a contact",
        blocks: [
          {
            businessOnly: true,
            steps: [
              "Click **Create Contact** at the top right. The **Create Contact** window opens.",
              "Under **Information**, enter the **First Name**, **Last Name** and **Email ID**. All three are required.",
              "Enter the **Contact Number**.",
              "Choose the **Contact Type**. This is required.",
              "Choose the **Facility**. It defaults to your organisation's facility.",
              "Optionally click **Profile Picture (Max 1MB)** to add a photo.",
              "Under **Address**, type in **Search Address** to find the address, or fill in the fields yourself: **Country**, **Street**, **City**, **State/Province** and **Postal Code**. All are required.",
              "Click **Create**. The button is only available once every required field is filled in. To close without saving, click **Cancel**."
            ]
          },
          {
            individualOnly: true,
            steps: [
              "Click **Create Contact** at the top right. The **Create Contact** window opens.",
              "Under **Information**, enter the **First Name**, **Last Name** and **Email ID**. All three are required.",
              "Optionally enter the **Contact Number**.",
              "Optionally click **Profile Picture (Max 1MB)** to add a photo.",
              "Optionally add an **Address**: type in **Search Address** to find it, or fill in the fields yourself: **Country**, **Street**, **City**, **State/Province** and **Postal Code**.",
              "Click **Create**. The button is only available once every required field is filled in. To close without saving, click **Cancel**."
            ]
          },
          {
            businessOnly: true,
            img: 32,
            caption: "Create Contact window"
          }
        ]
      },
      {
        id: "archived-contacts",
        title: "Archived contacts",
        blocks: [
          {
            p: "Archive contacts you no longer work with to keep your list tidy. Archived contacts are kept, not deleted."
          },
          {
            steps: [
              "To archive a contact, click the archive icon in the **Action** column of the Contacts list.",
              "To see archived contacts, click **Archives** at the top right of the Contacts list. The **Archived Contacts** list opens, showing the date each contact was archived.",
              "Use **Search contacts** to find an archived contact.",
              "To bring a contact back, click the restore icon in the **Action** column.",
              "Click **Back to Contacts** to return to the main list."
            ]
          },
          {
            businessOnly: true,
            img: 33,
            caption: "Archived Contacts list"
          }
        ]
      }
    ]
  },
  {
    id: "templates",
    group: "setup",
    icon: "description",
    title: "Templates",
    summary: "Create a document once, insert fields, and reuse it every time.",
    audience: ["Senders"],
    related: ["send", "contacts", "folders"],
    intro: [
      {
        p: "Templates let you create a document once and reuse it, such as a service agreement or consent form you send often. Select **Templates** from the left-hand menu. The page opens on the **Templates** tab, next to **All Documents**."
      }
    ],
    sections: [
      {
        id: "the-templates-list",
        title: "The Templates list",
        blocks: [
          {
            p: "The list shows each template with these columns:"
          },
          {
            table: [
              ["**Column**", "**What it shows**"],
              ["**Template Name**", "The name of the template."],
              [
                "**Source**",
                "How the template was made: **Upload** for an uploaded file, or **Scratch** for one written in the editor."
              ],
              [
                "**Type**",
                "Who the template is for: **Users**, **Contacts** or **Organisation** (see [Create a template from scratch](templates#create-a-template-from-scratch))."
              ],
              ["**Created By**", "The person who created the template."],
              [
                "**Status**",
                "**Published** templates are ready to use. **Draft** templates are saved but not yet published."
              ],
              ["**Actions**", "Preview, edit or archive the template."]
            ]
          },
          {
            bullets: [
              "Use **Search** to find a template by name, and the **Type** and **Status** filters to narrow the list.",
              "Click the refresh icon to reload the list.",
              "Click **Archives** to see archived templates.",
              "Click **Library** to browse the template library.",
              "Click **Create** to add a template. Choose **Upload** to start from a Word or PDF file, or **Create From Scratch** to write it in the editor."
            ]
          },
          {
            p: "When there are no templates yet, the list reads **No records found**."
          },
          {
            img: 34,
            caption: "Templates list with the Create menu open"
          }
        ]
      },
      {
        id: "create-a-template-from-scratch",
        title: "Create a template from scratch",
        blocks: [
          {
            p: "Choose **Create** > **Create From Scratch**. The template editor opens in three panels: **Template Details** on the left, the document in the centre, and the fields you can insert on the right."
          },
          {
            img: 35,
            caption: "Template editor with fields inserted into the document"
          },
          {
            h: "Template details"
          },
          {
            steps: [
              "Enter a **Template Name**. This is required.",
              "Optionally enter a **Description** so others know what the template is for.",
              "Choose the **Type**. This is required.",
              "Turn on **Header & Footer** if the template needs a header and footer on each page."
            ]
          },
          {
            table: [
              ["**Type**", "**Use it for**"],
              [
                "**Users**",
                "Documents for people in your organisation, such as employment contracts and policy acknowledgements."
              ],
              [
                "**Contacts**",
                "Documents for your contacts, such as client service agreements and consent forms."
              ],
              [
                "**Organisation**",
                "Documents about your organisation itself, such as supplier agreements."
              ]
            ]
          },
          {
            img: 36,
            caption: "Choosing the template Type"
          },
          {
            h: "Write the document"
          },
          {
            p: "Type the content in the centre panel. Use the toolbar to format it: font and size, bold, italic, underline and strikethrough, text and highlight colour, subscript and superscript, headings (H1, H2), quotes and code, numbered and bullet lists, indents, alignment, links, images and clear formatting."
          },
          {
            h: "Insert fields"
          },
          {
            p: "The right-hand panel lists the fields you can place in the document. Each field becomes a placeholder that is filled in for each person you send the template to."
          },
          {
            bullets: [
              "**Demographic Details** holds the standard fields: Full Name, First Name, Last Name, Email, Contact Number, Address, Date, Time and Date of Signing. Scroll the panel to see more.",
              "**Custom Details** holds your own fields. Click **+ Add Custom Field** to create one, such as a Client ID. Until you add one, the panel reads \"No custom fields yet.\"",
              "Drag a field from either panel and drop it into the document where it should appear."
            ]
          },
          {
            h: "Save, preview and publish"
          },
          {
            table: [
              ["**Button**", "**What it does**"],
              ["**Preview**", "Shows how the finished template will look."],
              [
                "**Publish**",
                "Saves the template and makes it available to use. Its status becomes **Published**."
              ],
              [
                "**Save as Draft**",
                "Saves your work without publishing it. Its status is **Draft**."
              ],
              ["**Cancel**", "Closes the editor without saving your changes."]
            ]
          }
        ]
      }
    ]
  },
  {
    id: "folders",
    group: "setup",
    icon: "folder",
    title: "Folders",
    summary: "Store, email and archive the files your organisation needs to keep.",
    audience: ["Senders"],
    related: ["templates", "contacts", "dashboard"],
    intro: [
      {
        p: "Use **Folders** to store and organise files your organisation needs to keep, such as policies, insurance certificates and reports, and to email them to people when needed. Select **Folders** from the left-hand menu. The page opens on the **Attachments** tab."
      }
    ],
    sections: [
      {
        id: "browse-folders-and-attachments",
        title: "Browse folders and attachments",
        blocks: [
          {
            p: "The left panel shows your folder tree. **All Documents** is the top-level folder. **Public** is visible to all users in your organisation. Any folders you create appear in the tree under their parent folder."
          },
          {
            p: "Select a folder to see the attachments in it. The folder name is shown above the list, for example **Folder: Public (Visible to all users)**."
          },
          {
            table: [
              ["**Column**", "**What it shows**"],
              ["**Name**", "The attachment name."],
              ["**Type**", "The attachment type, for example Insurance, Policy or Report."],
              [
                "**Comments**",
                "Any notes added when the attachment was uploaded or updated."
              ],
              ["**Uploaded By**", "The person who uploaded the attachment."],
              [
                "**Last Updated User** and **Last Updated Date**",
                "Who last changed the attachment, and when."
              ],
              [
                "**Expiry Date**",
                "When the attachment expires, if an expiry date was set."
              ],
              [
                "**Actions**",
                "View, Send Email, Email History, Edit, Archive and Delete (see Sections 7.4 to 7.7)."
              ]
            ]
          },
          {
            bullets: [
              "Use **Search documents** to find an attachment in the selected folder.",
              "Use **Page Size** and the **First / Previous / Next / Last** buttons to move through long lists. **Total Records** shows the count.",
              "When a folder is empty, the list reads **No records found**."
            ]
          },
          {
            img: 37,
            caption: "Attachments in the Public folder"
          }
        ]
      },
      {
        id: "create-a-folder",
        title: "Create a folder",
        blocks: [
          {
            steps: [
              "Click **+ New Folder** at the top of the folder tree. The **Create New Folder** window opens.",
              "Enter a **Folder Name**. This is required.",
              "Choose the **Parent Folder** the new folder sits under. It defaults to **All Documents**.",
              "Click **Create Folder**, or **Cancel** to close without saving."
            ]
          },
          {
            img: 38,
            caption: "Create New Folder window"
          }
        ]
      },
      {
        id: "add-an-attachment",
        title: "Add an attachment",
        blocks: [
          {
            steps: [
              "Select the folder you want to add the file to.",
              "Click **Add Attachment** at the top right. The **Add Attachment** window opens.",
              "Enter an **Attachment Name**. This is required.",
              "Choose a **Type**. This is required. If the type you need is not listed, type it in **Add new type…** at the bottom of the list and click **Add**.",
              "Optionally set an **Expiry Date** using the calendar, and add **Comments**.",
              "Click the upload area, or drag a file onto it. Supported formats are JPG, JPEG, PNG, PDF and DOCX, up to **50 MB**.",
              "Click **Save**, or **Cancel** to close without saving."
            ]
          },
          {
            img: 39,
            caption: "Choosing a Type, or adding a new one"
          },
          {
            img: 40,
            caption: "Add Attachment window with a file selected"
          }
        ]
      },
      {
        id: "attachment-actions",
        title: "Attachment actions",
        blocks: [
          {
            p: "Each attachment has these icons in the **Actions** column. Hover over an icon to see its name."
          },
          {
            table: [
              ["**Icon**", "**What it does**"],
              ["**View** (eye)", "Opens the attachment to view it."],
              [
                "**Send Email** (envelope)",
                "Emails the attachment to one or more people (see [Email an attachment](folders#email-an-attachment))."
              ],
              [
                "**Email History** (clock)",
                "Shows every time the attachment has been emailed (see [View email history](folders#view-email-history))."
              ],
              [
                "**Edit** (pencil)",
                "Updates the attachment's details or replaces the file (see [Update an attachment](folders#update-an-attachment))."
              ],
              [
                "**Archive**",
                "Moves the attachment to **Archived Attachments**. It is kept and can be restored (see [Archived attachments](folders#archived-attachments))."
              ],
              ["**Delete** (bin)", "Removes the attachment."]
            ]
          }
        ]
      },
      {
        id: "email-an-attachment",
        title: "Email an attachment",
        blocks: [
          {
            steps: [
              "Click the **Send Email** icon on the attachment. The **Send Email** window opens, showing the attachment name.",
              "**From** is filled in with your email address and cannot be changed.",
              "In **To**, enter the recipient's email address. This is required. Separate several addresses with commas.",
              "Optionally enter **CC** addresses.",
              "Check the **Subject**. It is filled in as \"Document:\" followed by the attachment name, and you can change it.",
              "Check the message. It is filled in with a standard message naming the document, who shared it and your organisation. Use the toolbar to edit and format it.",
              "Click **Send**, or **Cancel** to close without sending."
            ]
          },
          {
            img: 41,
            caption: "Send Email window"
          },
          {
            p: "Everyone in **To** and **CC** receives the email with the file attached. The email comes from your organisation's name, with the subject and message you set."
          },
          {
            img: 42,
            caption: "The email as received by the To and CC recipients"
          }
        ]
      },
      {
        id: "view-email-history",
        title: "View email history",
        blocks: [
          {
            p: "Click the **Email History** icon to see each time the attachment was emailed. Entries are grouped by date and show the time, who sent it, the **To** and **CC** addresses (with the number of recipients), and the subject. Click **✕** to close."
          },
          {
            img: 43,
            caption: "Email History for an attachment"
          }
        ]
      },
      {
        id: "update-an-attachment",
        title: "Update an attachment",
        blocks: [
          {
            steps: [
              "Click the **Edit** icon. The **Update Attachment** window opens with the current details filled in.",
              "Change the **Attachment Name**, **Type**, **Expiry Date** or **Comments** as needed.",
              "The **Current file** is shown as a link. To replace it, upload a new file in the upload area. Leave the upload area empty to keep the current file.",
              "Click **Update**, or **Cancel** to close without saving."
            ]
          },
          {
            img: 44,
            caption: "Update Attachment window"
          }
        ]
      },
      {
        id: "archived-attachments",
        title: "Archived attachments",
        blocks: [
          {
            steps: [
              "Click **Archives** at the top right. The **Archived Attachments** list opens.",
              "Select a folder to see the attachments archived from it. The list shows each attachment's **Name**, **Type**, **Archived Date**, **Expiry Date**, **Parent Folder** and **Folder Path**.",
              "Use the icons in the **Actions** column to **View** an attachment, **Download Attachment**, or **Restore** it to its folder.",
              "Click **Back to Documents** to return to the main list."
            ]
          },
          {
            img: 45,
            caption: "Archived Attachments list"
          }
        ]
      }
    ]
  },
  {
    id: "dashboard",
    group: "send",
    icon: "grid_view",
    title: "The T sign dashboard",
    summary: "Status cards, Quick Action and Recent Activity explained.",
    audience: ["Senders"],
    related: ["send", "track", "after"],
    intro: [
      {
        p: "The dashboard gives you a live summary of every document you have sent or been asked to sign."
      },
      {
        img: 46,
        caption: "T sign dashboard"
      }
    ],
    sections: [
      {
        id: "status-cards",
        title: "Status cards",
        blocks: [
          {
            p: "The four cards across the top count your documents by signing status. Click **View All →** on any card to open the list behind that number."
          },
          {
            table: [
              ["**Card**", "**What it shows**", "**What to do**"],
              [
                "**Action Required** (amber)",
                "Documents waiting for your signature.",
                "Open and sign these first."
              ],
              [
                "**Waiting for others** (blue)",
                "Documents you have sent that are still pending with one or more recipients.",
                "Check who has not signed and follow up if needed."
              ],
              [
                "**Expiring soon** (red)",
                "Documents due to expire within the next 7 days.",
                "Prioritise these so the request does not lapse."
              ],
              [
                "**Completed** (green)",
                "Documents that have been successfully signed.",
                "Open to view or download the signed copy."
              ]
            ]
          }
        ]
      },
      {
        id: "quick-action",
        title: "Quick Action",
        blocks: [
          {
            bullets: [
              "**View All Documents** opens the full list of T sign documents across every status.",
              "**Upload area** starts a new signing request. Drag a file into the dashed box or click **Browse**. Only **Word and PDF** files are supported, up to **20 MB** each."
            ]
          }
        ]
      },
      {
        id: "recent-activity",
        title: "Recent Activity",
        blocks: [
          {
            p: "This panel is a running log of the latest T sign events, newest first. The badge beside the heading shows how many entries are listed. Each entry records who did what, to which document, and when."
          },
          {
            p: "When there is no activity yet, the panel reads \"No Recent Activities Data to show.\""
          }
        ]
      }
    ]
  },
  {
    id: "send",
    group: "send",
    icon: "send",
    title: "Send a document for signature",
    summary: "Upload, choose the type, add recipients, place fields and send.",
    audience: ["Senders"],
    related: ["track", "sign", "good-practice"],
    intro: [
      {
        tip: "Have your Word or PDF file ready. Each file can be up to **20 MB**. If you will sign too, create your signature first in [My Profile and Signatures](profile#create-a-signature).",
        title: "Before you start"
      },
      {
        p: "When you upload a file, T sign opens the **document preparation screen**. The left panel holds three sections: **Document Type**, **Recipients** and **Drag & Drop**. The right panel shows a preview of your document, with a toolbar across the top and the page indicator at the bottom."
      },
      {
        img: 47,
        caption: "Document preparation screen as it opens after upload"
      }
    ],
    sections: [
      {
        id: "upload-the-document",
        title: "Upload the document",
        blocks: [
          {
            steps: [
              "In **Quick Action**, drag your Word or PDF file into the upload area, or click **Browse** to choose it.",
              "Make sure the file is no larger than 20 MB.",
              "The preparation screen opens with your document in the preview. At this point no document type is selected and **Recipients ( 0 )** shows that no recipients have been added."
            ]
          }
        ]
      },
      {
        id: "choose-the-document-type",
        title: "Choose the Document Type",
        blocks: [
          {
            steps: [
              "Open the **Document Type** dropdown. It shows **Select Document Type** until you choose one.",
              "Select the type that best describes the document. Type in **Search document type…** to filter the list. The selected type shows a tick.",
              "If the type you need is not listed, click **+ Add Document Type** at the top of the list to create one.",
              "To change or remove an existing type, use the edit (pencil) or delete (bin) icon beside it in the list."
            ]
          },
          {
            chips: [
              "Agreement",
              "Consent & Authorisation",
              "Contract",
              "Legal Document",
              "Service Agreement"
            ],
            label: "Example types"
          },
          {
            img: 48,
            caption: "Document Type dropdown with search, Add Document Type, and edit and delete icons"
          },
          {
            h: "I'm the only signer"
          },
          {
            p: "Below the dropdown is the **I'm the only signer** checkbox. Tick it when you are the only person who needs to sign the document, so you do not need to send it to anyone else."
          }
        ]
      },
      {
        id: "add-recipients-and-set-the-signing-order",
        title: "Add recipients and set the signing order",
        blocks: [
          {
            steps: [
              "In the **Recipients** section, click **+ Add Recipient**. The **Edit Recipients** window opens.",
              "Enter the **Recipient Name** and **Recipient Email**. Both are required.",
              "Click **+ Add Recipient** in the window to add another person, such as a co-signer or authorised representative. Each new row gets the next order number.",
              "The **Order** number sets the signing order. To change it, drag a row up or down using the handle (⠿) beside its number.",
              "Click **Done**. The button is only available once every name and email has been entered."
            ]
          },
          {
            img: 49,
            caption: "Edit Recipients window with two recipients in signing order"
          },
          {
            p: "After you click **Done**, the Recipients section shows the number of recipients, for example **Recipients ( 2 )**, and the **active recipient** with their initials, for example **Olivia Bennett**. The active recipient is the person the fields you place will be assigned to. Use the dropdown to switch to another recipient before placing their fields."
          }
        ]
      },
      {
        id: "place-fields-on-the-document",
        title: "Place fields on the document",
        blocks: [
          {
            p: "The **Drag & Drop ( 11 )** panel lists the standard fields you can add to the document. Any custom fields you have created are listed below them (see [Add a custom field (optional)](send#add-a-custom-field-optional))."
          },
          {
            chips: [
              "Full Name",
              "Email",
              "Contact Number",
              "Address",
              "Date",
              "Date of Signing",
              "Title",
              "Initials",
              "ABN",
              "Signature",
              "First Name"
            ],
            label: "Standard fields"
          },
          {
            steps: [
              "Check that the right recipient is selected as the active recipient.",
              "Drag a field from the panel and drop it onto the document where that recipient needs to fill it in.",
              "The field appears on the document as a dashed box with its icon and name, for example **Full Name** or **Signature**.",
              "To remove a placed field, click the **×** on its corner.",
              "Scroll through the preview to place fields on any page. The indicator at the bottom shows where you are, for example **Page 1 of 4**.",
              "Repeat for each recipient, switching the active recipient each time."
            ]
          },
          {
            img: 50,
            caption: "Recipients added and fields placed on the document"
          }
        ]
      },
      {
        id: "add-a-custom-field-optional",
        title: "Add a custom field (optional)",
        blocks: [
          {
            p: "If you need a field that is not in the standard list, such as a Client ID, you can create your own."
          },
          {
            steps: [
              "Click **+ Add Custom Field**. The **Create Custom Field** panel opens in place of the Drag & Drop list.",
              "Enter a **Field Label**. This is required.",
              "Choose a **Data Type**. This is also required.",
              "Save the field. It is added to the Drag & Drop panel with a dashed outline and an icon that matches its data type, for example **$** for Currency or a tick box for Checkbox.",
              "Drag the custom field onto the document like any standard field.",
              "To delete a custom field, click the bin icon beside it."
            ]
          },
          {
            chips: ["Text", "Long Text", "Number", "Currency", "Date", "Email", "Phone", "Boolean / Checkbox"],
            label: "Data types"
          },
          {
            p: "Scroll the list to see further options."
          },
          {
            img: 51,
            caption: "Create Custom Field panel with Data Type options"
          }
        ]
      },
      {
        id: "use-the-preview-toolbar",
        title: "Use the preview toolbar",
        blocks: [
          {
            p: "The toolbar above the document preview helps you place fields accurately."
          },
          {
            table: [
              ["**Control**", "**What it does**"],
              ["**Undo / Redo**", "Undo or redo your last change to the placed fields."],
              ["**Refresh**", "Reloads the document preview."],
              ["**Panel toggle**", "Shows or hides the side panel."],
              [
                "**Zoom out / Zoom in**",
                "Makes the preview smaller or larger. The current zoom level is shown between them, for example **100%**."
              ]
            ]
          }
        ]
      },
      {
        id: "send-the-document",
        title: "Send the document",
        blocks: [
          {
            steps: [
              "Click **Send** at the bottom right of the screen. To discard the request instead, click **Cancel**.",
              "A **Confirm Submission** dialog appears. It lists every recipient under **Recipients Emails**.",
              "Review the details carefully, then click **Send** to confirm, or **Close** to go back and make changes."
            ]
          },
          {
            warning: "Once a document is sent, you will not be able to make any changes to it."
          },
          {
            img: 52,
            caption: "Confirm Submission dialog"
          },
          {
            steps: [
              "A **Document Sent Successfully** message confirms the request has gone out. You will be notified once the document has been signed and completed.",
              "Click **Done** to close the message."
            ]
          },
          {
            img: 53,
            caption: "Document Sent Successfully message"
          }
        ]
      },
      {
        id: "what-happens-next",
        title: "What happens next",
        blocks: [
          {
            bullets: [
              "The **Waiting for others** count on the dashboard goes up by one. In the sample data it moves from 5 to 6.",
              "A new entry appears at the top of **Recent Activity**, showing the document and its recipients.",
              "Each recipient receives an email with a link to sign the document (see [Sign a document (recipient)](sign))."
            ]
          },
          {
            img: 54,
            caption: "Dashboard after sending: Waiting for others increased to 6"
          }
        ]
      }
    ]
  },
  {
    id: "track",
    group: "send",
    icon: "hourglass_top",
    title: "Track documents waiting for others",
    summary: "See who still needs to sign, and follow up early.",
    audience: ["Senders"],
    related: ["send", "after", "good-practice"],
    intro: [
      {
        p: "Click **View All →** on the **Waiting for others** card to see every document still pending with recipients. The heading shows the number of pending documents, for example **Waiting for Others: 1**."
      },
      {
        img: 55,
        caption: "Waiting for Others list"
      },
      {
        table: [
          ["**Column**", "**What it shows**"],
          ["No.", "Row number."],
          [
            "Created By",
            "The person who sent the document, with the date it was sent."
          ],
          ["Document Name", "The file name of the document."],
          ["Recipient List", "Every recipient the document was sent to."],
          [
            "Individual Recipient Status",
            "Each recipient's email with their own status, for example \"Pending\"."
          ],
          [
            "Status Indicator",
            "The overall status of the document, for example **Pending**."
          ],
          [
            "Action",
            "The eye icon views the document. The download icon downloads a copy."
          ]
        ]
      },
      {
        bullets: [
          "Use **Search** to find a document, then click the arrow to run the search.",
          "Use **Page Size** and the **First / Previous / Next / Last** buttons to move through long lists. **Total Records** shows the full count.",
          "Click **Close** to return to the dashboard."
        ]
      }
    ],
    sections: []
  },
  {
    id: "sign",
    group: "signing",
    icon: "stylus",
    title: "Sign a document (recipient)",
    summary: "What recipients see, from the email to the signed PDF.",
    audience: ["Recipients"],
    related: ["after", "send", "good-practice"],
    intro: [
      {
        p: "This section describes what the recipient sees and does after a document has been sent to them."
      }
    ],
    sections: [
      {
        id: "receive-the-email",
        title: "Receive the email",
        blocks: [
          {
            p: "When a document is sent, each recipient receives an email from **noreply@tesseractapps.com** with the subject **Action Required: Please Sign the Document**. The email explains the steps and contains a **View and Sign Document** button."
          },
          {
            img: 56,
            caption: "\"Action Required\" email with the signing link"
          },
          {
            warning: "The signing link expires 14 days after it is issued. The email contains a secure link, so recipients should not share it or forward it to anyone else."
          }
        ]
      },
      {
        id: "open-the-document",
        title: "Open the document",
        blocks: [
          {
            steps: [
              "Click **View and Sign Document** in the email.",
              "The document opens on the T sign signing page in your web browser. No TesseractApps login is needed.",
              "The fields placed by the sender appear on the document as dashed boxes, for example **Enter Full Name**, **Upload Signature** and any custom fields.",
              "Use **Previous** and **Next** at the bottom to move through the pages. The page indicator shows where you are, for example **Page 1 of 11**."
            ]
          },
          {
            img: 57,
            caption: "Document opened on the T sign signing page"
          }
        ]
      },
      {
        id: "complete-the-fields-and-add-your-signature",
        title: "Complete the fields and add your signature",
        blocks: [
          {
            steps: [
              "Click into each text field, such as **Enter Full Name** or a custom field, and type the required details.",
              "Click the **Upload Signature** button."
            ]
          },
          {
            img: 58,
            caption: "Upload Signature button on the document"
          },
          {
            p: "The **Choose Signature Action** dialog opens. Choose one of the three ways to sign:"
          },
          {
            table: [
              ["**Option**", "**How it works**"],
              [
                "**Upload Signature**",
                "Upload an image of your signature from your device."
              ],
              [
                "**Draw Signature**",
                "Draw your signature with your mouse, trackpad or finger."
              ],
              [
                "**Enter Name for Signature**",
                "Type your name, and T sign creates a signature from it."
              ]
            ]
          },
          {
            p: "Click the **X** at the top right of the dialog to close it without signing."
          },
          {
            img: 59,
            caption: "Choose Signature Action dialog"
          }
        ]
      },
      {
        id: "confirm-your-details",
        title: "Confirm your details",
        blocks: [
          {
            steps: [
              "Once every field is complete, click **Proceed** at the bottom of the page.",
              "The **Confirm Recipient Details** dialog asks you to confirm your details before submitting.",
              "Click **Edit Details** to go back and make changes, or **Proceed** to continue."
            ]
          },
          {
            img: 60,
            caption: "Confirm Recipient Details dialog"
          }
        ]
      },
      {
        id: "review-and-submit",
        title: "Review and submit",
        blocks: [
          {
            steps: [
              "The **PDF Viewer** opens, showing the full document with your details and signature in place.",
              "Scroll through every page to check the document.",
              "Click **Submit** at the bottom of the viewer."
            ]
          },
          {
            img: 61,
            caption: "PDF Viewer with the Submit button"
          }
        ]
      },
      {
        id: "signed-pdf-generated",
        title: "Signed PDF generated",
        blocks: [
          {
            p: "After you click Submit, T sign displays **Generating your PDF… Please wait.** while it creates the final signed copy. Keep the page open until this finishes."
          },
          {
            img: 62,
            caption: "Generating the signed PDF"
          },
          {
            p: "When the PDF is ready, a **Document signed Successfully** message confirms that your signature has been recorded. You will receive a confirmation email shortly."
          },
          {
            bullets: ["Click **Download PDF** to save a copy of the signed document."]
          },
          {
            img: 63,
            caption: "Document signed Successfully message with Download PDF"
          }
        ]
      }
    ]
  },
  {
    id: "after",
    group: "signing",
    icon: "task_alt",
    title: "After signing",
    summary: "How a document moves to Completed and where the signed copy is.",
    audience: ["Senders"],
    related: ["dashboard", "track", "sign"],
    intro: [
      {
        p: "Once the signed PDF has been generated, the document is complete. On the sender's T sign dashboard:"
      },
      {
        bullets: [
          "The document moves from **Waiting for others** to **Completed**. In the sample data, Waiting for others drops from 6 to 5 and Completed rises from 18 to 19.",
          "A new entry appears at the top of **Recent Activity**, showing that the recipient signed the document.",
          "The sender is notified that the document has been signed and completed.",
          "Click **View All →** on the **Completed** card to view or download the signed copy."
        ]
      },
      {
        img: 64,
        caption: "Dashboard after signing: document moved to Completed"
      }
    ],
    sections: []
  },
  {
    id: "good-practice",
    group: "signing",
    icon: "lightbulb",
    title: "Good practice",
    summary: "Daily habits that keep documents moving and links private.",
    audience: ["Senders"],
    related: ["send", "track", "dashboard"],
    intro: [
      {
        bullets: [
          "**Check the dashboard daily.** Look at Action Required and Expiring soon at the start of each day.",
          "**Check before you send.** Make sure every recipient's email address is correct and every required field has been placed. Changes cannot be made after the document is sent.",
          "**Follow up early.** Signing links expire 14 days after they are issued. Use the Waiting for Others list to see who has not yet signed.",
          "**Use the right Document Type.** This keeps documents easy to find and report on later.",
          "**Set the signing order before placing fields.** Add all recipients in the order they should sign, then place each person's fields with them selected as the active recipient.",
          "**Keep signing links private.** Remind recipients not to forward the signing email."
        ]
      }
    ],
    sections: []
  }
];