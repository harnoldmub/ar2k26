import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail =
  process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";

export async function sendRsvpConfirmationEmail(guestData: {
  firstName: string;
  lastName: string;
  availability: string;
}) {
  try {
    const availabilityText =
      {
        "19-march": "19 mars uniquement (Mariage coutumier)",
        "21-march":
          "21 mars uniquement (Mariage Civil + Bénédiction nuptiale + Grande fête)",
        both: "Les deux dates (19 et 21 mars)",
        unavailable: "Pas disponible",
      }[guestData.availability] || guestData.availability;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 2px solid #C8A96A;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              color: #C8A96A;
              margin: 0;
              font-size: 32px;
            }
            .content {
              padding: 30px 0;
            }
            .info-box {
              background: #f9f9f9;
              border-left: 4px solid #C8A96A;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Golden Love 2026</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Ruth & Arnold</p>
          </div>
          
          <div class="content">
            <h2 style="color: #333;">Nouvelle réponse RSVP reçue</h2>
            
            <div class="info-box">
              <p><strong>Invité :</strong> ${guestData.firstName} ${guestData.lastName}</p>
              <p><strong>Disponibilité :</strong> ${availabilityText}</p>
              <p><strong>Date de réponse :</strong> ${new Date().toLocaleDateString(
                "fr-FR",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}</p>
            </div>
            
            <p>Vous pouvez gérer les attributions de tables dans votre espace administrateur.</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Ruth & Arnold - Golden Love</p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: "we@ar2k26.com",
      subject: `Nouvelle réponse RSVP - ${guestData.firstName} ${guestData.lastName}`,
      html: emailHtml,
    });

    console.log("RSVP confirmation email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send RSVP confirmation email:", error);
    throw error;
  }
}

export async function sendGuestConfirmationEmail(guestData: {
  email: string;
  firstName: string;
  lastName: string;
  availability: string;
}) {
  try {
    const availabilityText =
      {
        "19-march": "19 mars uniquement (Mariage coutumier)",
        "21-march":
          "21 mars uniquement (Mariage Civil + Bénédiction nuptiale + Grande fête)",
        both: "Les deux dates (19 et 21 mars)",
        unavailable: "Pas disponible",
      }[guestData.availability] || guestData.availability;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: #fff;
            }
            .header {
              text-align: center;
              padding: 40px 0;
              background: linear-gradient(135deg, #f5f5f0 0%, #fff 100%);
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              color: #C8A96A;
              margin: 0;
              font-size: 36px;
              letter-spacing: 2px;
            }
            .content {
              padding: 20px 0;
            }
            .confirmation-box {
              background: linear-gradient(135deg, #C8A96A 0%, #D4AF37 100%);
              color: white;
              padding: 25px;
              border-radius: 8px;
              text-align: center;
              margin: 25px 0;
            }
            .confirmation-box h2 {
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .info-box {
              background: #f9f9f9;
              border-left: 4px solid #C8A96A;
              padding: 20px;
              margin: 25px 0;
            }
            .dates-section {
              background: #fff;
              border: 2px solid #C8A96A;
              border-radius: 8px;
              padding: 25px;
              margin: 30px 0;
            }
            .date-item {
              padding: 12px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .date-item:last-child {
              border-bottom: none;
            }
            .date-title {
              color: #C8A96A;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              text-align: center;
              padding-top: 30px;
              border-top: 2px solid #C8A96A;
              color: #666;
              font-size: 14px;
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Golden Love 2026</h1>
            <p style="color: #666; margin: 15px 0 0 0; font-size: 18px;">Ruth & Arnold</p>
          </div>
          
          <div class="content">
            <div class="confirmation-box">
              <h2>Merci ${guestData.firstName} !</h2>
              <p style="margin: 0;">Votre réponse a bien été enregistrée</p>
            </div>
            
            <p>Cher(e) ${guestData.firstName} ${guestData.lastName},</p>
            
            <p>Nous avons bien reçu votre réponse et nous vous remercions chaleureusement d'avoir pris le temps de nous répondre.</p>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>Votre disponibilité :</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 18px; color: #C8A96A;">${availabilityText}</p>
            </div>
            
            <p style="background: #fff8e7; border: 1px solid #C8A96A; border-radius: 6px; padding: 15px; font-size: 14px; color: #666;">
              <strong style="color: #C8A96A;">Important :</strong> Votre réponse a bien été enregistrée, mais celle-ci ne constitue pas une confirmation définitive de votre présence. Votre invitation officielle vous sera envoyée avant le mariage.
            </p>
            
            <p>Nous avons hâte de partager ces moments précieux avec vous !</p>
            
            <p style="margin-top: 30px;">
              Avec toute notre affection,<br>
              <strong>Ruth & Arnold</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 Ruth & Arnold - Golden Love</p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: guestData.email,
      subject: `Merci ${guestData.firstName} ! Votre réponse a bien été enregistrée - Ruth & Arnold`,
      html: emailHtml,
    });

    console.log("Guest confirmation email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send guest confirmation email:", error);
    throw error;
  }
}

export async function sendContributionNotification(contributionData: {
  donorName: string;
  amount: number;
  currency: string;
  message?: string | null;
}) {
  try {
    const formattedAmount = (contributionData.amount / 100).toFixed(2);
    const currencySymbol = contributionData.currency === 'eur' ? '€' : contributionData.currency.toUpperCase();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              border-bottom: 2px solid #C8A96A;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              color: #C8A96A;
              margin: 0;
              font-size: 32px;
            }
            .content {
              padding: 30px 0;
            }
            .amount-box {
              background: linear-gradient(135deg, #C8A96A 0%, #D4AF37 100%);
              color: white;
              padding: 25px;
              border-radius: 8px;
              text-align: center;
              margin: 25px 0;
            }
            .amount-box h2 {
              margin: 0;
              font-size: 36px;
            }
            .info-box {
              background: #f9f9f9;
              border-left: 4px solid #C8A96A;
              padding: 15px;
              margin: 20px 0;
            }
            .message-box {
              background: #fff8e7;
              border: 1px solid #C8A96A;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              font-style: italic;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Golden Love 2026</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Ruth & Arnold</p>
          </div>
          
          <div class="content">
            <h2 style="color: #333;">Nouvelle contribution reçue !</h2>
            
            <div class="amount-box">
              <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Montant de la contribution</p>
              <h2>${formattedAmount} ${currencySymbol}</h2>
            </div>
            
            <div class="info-box">
              <p><strong>Donateur :</strong> ${contributionData.donorName}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleDateString(
                "fr-FR",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}</p>
            </div>
            
            ${contributionData.message ? `
            <div class="message-box">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #C8A96A;">Message du donateur :</p>
              <p style="margin: 0;">"${contributionData.message}"</p>
            </div>
            ` : ''}
            
            <p>Félicitations ! Une nouvelle contribution a été effectuée pour votre cagnotte de mariage.</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Ruth & Arnold - Golden Love</p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: "we@ar2k26.com",
      subject: `Nouvelle contribution - ${contributionData.donorName} : ${formattedAmount}${currencySymbol}`,
      html: emailHtml,
    });

    console.log("Contribution notification email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send contribution notification email:", error);
    throw error;
  }
}

export async function sendContributorThankYou(contributorData: {
  email: string;
  donorName: string;
  amount: number;
  currency: string;
}) {
  try {
    const formattedAmount = (contributorData.amount / 100).toFixed(2);
    const currencySymbol = contributorData.currency === 'eur' ? '€' : contributorData.currency.toUpperCase();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.8;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: #fff;
            }
            .header {
              text-align: center;
              padding: 40px 0;
              background: linear-gradient(135deg, #f5f5f0 0%, #fff 100%);
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              color: #C8A96A;
              margin: 0;
              font-size: 36px;
              letter-spacing: 2px;
            }
            .content {
              padding: 20px 0;
            }
            .heart-icon {
              text-align: center;
              font-size: 48px;
              margin: 20px 0;
            }
            .thank-you-box {
              background: linear-gradient(135deg, #C8A96A 0%, #D4AF37 100%);
              color: white;
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              margin: 25px 0;
            }
            .thank-you-box h2 {
              margin: 0 0 10px 0;
              font-size: 28px;
              font-family: 'Playfair Display', serif;
            }
            .amount-display {
              background: rgba(255,255,255,0.2);
              padding: 15px 25px;
              border-radius: 8px;
              display: inline-block;
              margin-top: 15px;
            }
            .amount-display span {
              font-size: 24px;
              font-weight: bold;
            }
            .message-section {
              background: #fff8e7;
              border: 2px solid #C8A96A;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
            }
            .signature {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #C8A96A;
            }
            .signature p {
              font-family: 'Great Vibes', cursive;
              font-size: 28px;
              color: #C8A96A;
              margin: 10px 0;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Golden Love 2026</h1>
            <p style="color: #666; margin: 15px 0 0 0; font-size: 18px;">Ruth & Arnold</p>
          </div>
          
          <div class="content">
            <div class="heart-icon">💕</div>
            
            <div class="thank-you-box">
              <h2>Merci infiniment, ${contributorData.donorName} !</h2>
              <p style="margin: 10px 0 0 0; opacity: 0.95;">Votre générosité nous touche profondément</p>
              <div class="amount-display">
                <span>${formattedAmount} ${currencySymbol}</span>
              </div>
            </div>
            
            <div class="message-section">
              <p style="font-size: 18px; margin: 0; color: #333;">
                Cher(e) ${contributorData.donorName},
              </p>
              <p style="margin: 15px 0; color: #555;">
                Du fond du cœur, nous tenons à vous remercier pour votre précieuse contribution à notre cagnotte de mariage.
              </p>
              <p style="margin: 15px 0; color: #555;">
                Votre geste d'amour et de générosité nous aide à construire les plus beaux souvenirs pour notre nouvelle vie ensemble. Chaque contribution est un témoignage de votre affection qui nous accompagnera pour toujours.
              </p>
              <p style="margin: 15px 0 0 0; color: #555;">
                Nous avons hâte de partager ces moments magiques avec vous les 19 et 21 mars 2026 !
              </p>
            </div>
            
            <div class="signature">
              <p>Avec tout notre amour,</p>
              <p style="font-size: 24px; margin-top: 5px;"><strong>Ruth & Arnold</strong></p>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2026 Ruth & Arnold - Golden Love</p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
              Ce message a été envoyé suite à votre contribution sur notre site de mariage.
            </p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: contributorData.email,
      subject: `Merci ${contributorData.donorName} ! 💕 Votre contribution nous touche - Ruth & Arnold`,
      html: emailHtml,
    });

    console.log("Contributor thank you email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send contributor thank you email:", error);
    throw error;
  }
}

export async function sendPersonalizedInvitation(recipientData: {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  message?: string;
  qrToken?: string;
}) {
  try {
    const customMessage =
      recipientData.message ||
      `Nous serions honorés de votre présence à notre mariage.`;
    const domain =
      process.env.SITE_URL ||
      (process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "http://localhost:5000");
    const invitationPageLink = recipientData.id 
      ? `${domain}/guest/${recipientData.id}`
      : null;
    const link = recipientData.qrToken
      ? `${domain}/checkin?token=${recipientData.qrToken}`
      : `${domain}/invitation/viewer`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              line-height: 1.9;
              color: #3a3a3a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: #fdfcfa;
            }
            .container {
              background: linear-gradient(180deg, #fffefa 0%, #faf7f0 100%);
              border-radius: 12px;
              padding: 50px 40px;
              border: 1px solid #e8dcc8;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            .header h1 {
              font-family: 'Playfair Display', Georgia, serif;
              color: #C8A96A;
              margin: 0;
              font-size: 38px;
              letter-spacing: 3px;
              font-weight: 400;
            }
            .divider {
              width: 60px;
              height: 2px;
              background: linear-gradient(90deg, transparent, #C8A96A, transparent);
              margin: 20px auto;
            }
            .content {
              text-align: center;
            }
            .greeting {
              font-size: 20px;
              color: #4a4a4a;
              margin-bottom: 30px;
            }
            .message {
              font-size: 17px;
              color: #555;
              line-height: 2;
              margin: 30px 0;
              padding: 0 10px;
            }
            .cta-section {
              margin: 40px 0;
              padding: 30px;
              background: rgba(200, 169, 106, 0.08);
              border-radius: 10px;
            }
            .cta-text {
              color: #666;
              font-size: 15px;
              margin-bottom: 20px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #C8A96A 0%, #B8956A 100%);
              color: white !important;
              padding: 18px 50px;
              text-decoration: none;
              border-radius: 30px;
              font-weight: 600;
              font-size: 16px;
              letter-spacing: 1px;
              box-shadow: 0 4px 15px rgba(200, 169, 106, 0.3);
            }
            .signature {
              margin-top: 40px;
              font-style: italic;
              color: #777;
              font-size: 16px;
            }
            .signature strong {
              display: block;
              margin-top: 10px;
              font-style: normal;
              color: #C8A96A;
              font-size: 20px;
              letter-spacing: 2px;
            }
            .footer {
              text-align: center;
              padding-top: 25px;
              margin-top: 30px;
              border-top: 1px solid #e8dcc8;
              color: #999;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ruth & Arnold</h1>
              <div class="divider"></div>
            </div>
            
            <div class="content">
              <p class="greeting">Cher(e) ${recipientData.firstName} ${recipientData.lastName},</p>
              
              <p class="message">
                Voici votre invitation officielle pour notre mariage.<br><br>
                Nous serions profondément honorés de votre présence<br>
                pour partager avec nous ces moments de joie et de bonheur.
              </p>
              
              ${invitationPageLink ? `
              <div class="cta-section">
                <p class="cta-text">Pour accéder à votre invitation personnalisée :</p>
                <a href="${invitationPageLink}" class="cta-button">
                  Accéder à mon invitation
                </a>
              </div>
              ` : ''}
              
              <p class="signature">
                Avec tout notre amour,
                <strong>Ruth & Arnold</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>Golden Love 2026</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: recipientData.email,
      subject: `Vous êtes invité(e) à notre mariage - Ruth & Arnold`,
      html: emailHtml,
    });

    console.log("Personalized invitation sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send personalized invitation:", error);
    throw error;
  }
}

// Email for when availability is changed from "both" to "21-march" only
export async function sendDateChangeApologyEmail(guestData: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.8;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #faf8f5;
            }
            .container {
              background: linear-gradient(135deg, #fffef9 0%, #faf5eb 100%);
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 20px rgba(200, 169, 106, 0.15);
            }
            .header {
              text-align: center;
              padding-bottom: 25px;
              border-bottom: 2px solid #C8A96A;
              margin-bottom: 30px;
            }
            .header h1 {
              font-family: 'Playfair Display', Georgia, serif;
              color: #C8A96A;
              font-size: 28px;
              margin: 0;
              font-weight: 400;
            }
            .content {
              padding: 20px 0;
            }
            .content p {
              margin: 15px 0;
              font-size: 16px;
              color: #555;
            }
            .highlight {
              background: linear-gradient(135deg, #C8A96A 0%, #d4b87a 100%);
              color: white;
              padding: 20px 25px;
              border-radius: 10px;
              text-align: center;
              margin: 25px 0;
            }
            .highlight strong {
              font-size: 20px;
              display: block;
              margin-bottom: 5px;
            }
            .footer {
              text-align: center;
              padding-top: 25px;
              border-top: 1px solid #e8e0d0;
              margin-top: 30px;
              color: #888;
              font-size: 14px;
            }
            .signature {
              font-family: 'Great Vibes', cursive;
              font-size: 24px;
              color: #C8A96A;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ruth & Arnold</h1>
            </div>
            <div class="content">
              <p>Cher(e) ${guestData.firstName} ${guestData.lastName},</p>
              
              <p>Nous vous remercions sincèrement d'avoir répondu à notre invitation et d'avoir exprimé votre souhait d'être présent(e) aux deux dates de notre mariage.</p>
              
              <p>Cependant, en raison du <strong>nombre de places limité</strong> pour la cérémonie du 19 mars, nous avons dû faire des choix difficiles pour l'organisation.</p>
              
              <p>Nous vous prions de bien vouloir nous excuser pour ce changement. Nous comptons sur votre compréhension, car comme mentionné dans notre invitation initiale, ces informations nous servaient principalement à mieux nous organiser.</p>
              
              <div class="highlight">
                <strong>Nous vous attendons avec joie</strong>
                Le 21 mars 2026<br>
                Mariage Civil + Bénédiction Nuptiale + Grande Fête
              </div>
              
              <p>Votre présence à cette journée exceptionnelle compte énormément pour nous, et nous avons hâte de célébrer ce moment unique avec vous.</p>
              
              <p>Avec toute notre affection,</p>
              <p class="signature">Ruth & Arnold</p>
            </div>
            <div class="footer">
              <p>21 Mars 2026 • Bruxelles, Belgique</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Ruth & Arnold - Mariage 2026" <${fromEmail}>`,
      to: guestData.email,
      subject: `Information importante concernant notre mariage - Ruth & Arnold`,
      html: emailHtml,
    });

    console.log("Date change apology email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send date change apology email:", error);
    throw error;
  }
}

function getDomain() {
  return (
    process.env.SITE_URL ||
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:5000")
  );
}

export function buildGalaEmailHtml(data: {
  firstName: string;
  galaLink: string;
  declineLink: string | null;
}): string {
  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              line-height: 1.9;
              color: #3a3a3a;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background: #fdfcfa;
            }
            .container {
              background: linear-gradient(180deg, #FAF6F0 0%, #F0E8DA 100%);
              border-radius: 12px;
              padding: 50px 40px;
              border: 1px solid #e8dcc8;
            }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 {
              font-family: 'Playfair Display', Georgia, serif;
              color: #B8943E; margin: 0; font-size: 38px;
              letter-spacing: 3px; font-weight: 400;
            }
            .divider {
              width: 60px; height: 2px;
              background: linear-gradient(90deg, transparent, #B8943E, transparent);
              margin: 20px auto;
            }
            .content { text-align: center; }
            .guest-name {
              font-family: 'Georgia', serif; font-size: 28px;
              color: #2C2418; font-style: italic; margin-bottom: 10px;
            }
            .greeting { font-size: 18px; color: #5C4F3D; margin-bottom: 30px; }
            .message { font-size: 16px; color: #5C4F3D; line-height: 2; margin: 25px 0; padding: 0 10px; }
            .cta-section {
              margin: 35px 0; padding: 25px;
              background: rgba(184, 148, 62, 0.08); border-radius: 10px;
            }
            .cta-text { color: #5C4F3D; font-size: 15px; margin-bottom: 20px; }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #B8943E 0%, #D4B062 100%);
              color: white !important; padding: 16px 45px; text-decoration: none;
              border-radius: 30px; font-weight: 600; font-size: 15px; letter-spacing: 1px;
              box-shadow: 0 4px 15px rgba(184, 148, 62, 0.3);
            }
            .footer { text-align: center; margin-top: 40px; color: #8A7D6B; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ruth &amp; Arnold</h1>
              <div class="divider"></div>
            </div>
            <div class="content">
              <p class="guest-name">${data.firstName}</p>
              <p class="greeting">Vous êtes cordialement invité(e) à notre mariage</p>
              <p class="message">
                Nous serions honorés de votre présence pour célébrer notre union.<br>
                Retrouvez tous les détails de la soirée sur votre invitation personnalisée.
              </p>
              <div class="cta-section">
                <p class="cta-text">Votre invitation personnalisée vous attend :</p>
                <a href="${data.galaLink}" class="cta-button">Voir mon invitation</a>
              </div>
              <p class="message" style="font-size: 14px; color: #8A7D6B;">
                Samedi 21 Mars 2026<br>
                Tenue : Gala (chic &amp; classe)
              </p>
              ${data.declineLink ? `
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e8dcc8;">
                <p style="font-size: 13px; color: #9A8E7E; margin-bottom: 12px;">Vous n'êtes plus disponible ?</p>
                <a href="${data.declineLink}" style="display: inline-block; background: transparent; color: #9A8E7E; padding: 10px 28px; text-decoration: none; border-radius: 20px; font-size: 13px; border: 1px solid #C8B8A0; letter-spacing: 0.5px;">Je ne pourrai pas être présent(e)</a>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <div class="divider"></div>
              <p>Avec tout notre amour,<br><strong>Ruth &amp; Arnold</strong></p>
              <p style="font-size: 11px; color: #aaa; margin-top: 15px;">Golden Love 2026</p>
            </div>
          </div>
        </body>
      </html>
  `;
}

export function buildInvitation21EmailHtml(data: {
  firstName: string;
  invitationLink: string;
  declineLink: string | null;
}): string {
  return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              line-height: 1.9; color: #3a3a3a;
              max-width: 600px; margin: 0 auto; padding: 20px; background: #fdfcfa;
            }
            .container {
              background: linear-gradient(180deg, #fffefa 0%, #faf7f0 100%);
              border-radius: 12px; padding: 50px 40px; border: 1px solid #e8dcc8;
            }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 {
              font-family: 'Playfair Display', Georgia, serif;
              color: #C8A96A; margin: 0; font-size: 38px;
              letter-spacing: 3px; font-weight: 400;
            }
            .divider {
              width: 60px; height: 2px;
              background: linear-gradient(90deg, transparent, #C8A96A, transparent);
              margin: 20px auto;
            }
            .content { text-align: center; }
            .greeting { font-size: 20px; color: #4a4a4a; margin-bottom: 30px; }
            .message { font-size: 17px; color: #555; line-height: 2; margin: 30px 0; padding: 0 10px; }
            .highlight-box {
              background: linear-gradient(135deg, #C8A96A 0%, #D4AF37 100%);
              color: white; padding: 25px; border-radius: 10px;
              text-align: center; margin: 30px 0;
            }
            .highlight-box h2 { margin: 0 0 5px 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif; }
            .highlight-box p { margin: 0; opacity: 0.95; font-size: 15px; }
            .cta-section { margin: 40px 0; padding: 30px; background: rgba(200, 169, 106, 0.08); border-radius: 10px; }
            .cta-text { color: #666; font-size: 15px; margin-bottom: 20px; }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #C8A96A 0%, #B8956A 100%);
              color: white !important; padding: 18px 50px; text-decoration: none;
              border-radius: 30px; font-weight: 600; font-size: 16px; letter-spacing: 1px;
              box-shadow: 0 4px 15px rgba(200, 169, 106, 0.3);
            }
            .signature {
              margin-top: 40px; font-style: italic; color: #777; font-size: 16px;
            }
            .signature strong {
              display: block; margin-top: 10px; font-style: normal;
              color: #C8A96A; font-size: 20px; letter-spacing: 2px;
            }
            .footer {
              text-align: center; padding-top: 25px; margin-top: 30px;
              border-top: 1px solid #e8dcc8; color: #999; font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ruth &amp; Arnold</h1>
              <div class="divider"></div>
            </div>
            <div class="content">
              <p class="greeting">Cher(e) ${data.firstName},</p>
              <div class="highlight-box">
                <h2>21 Mars 2026</h2>
                <p>Votre invitation est maintenant disponible</p>
              </div>
              <p class="message">
                Nous avons le plaisir de vous annoncer que votre invitation<br>
                pour le <strong>21 mars 2026</strong> est désormais disponible.<br><br>
                Découvrez tous les détails de cette journée exceptionnelle<br>
                en accédant à votre espace personnel.
              </p>
              <div class="cta-section">
                <p class="cta-text">Accédez à votre invitation personnalisée :</p>
                <a href="${data.invitationLink}" class="cta-button">Voir mon invitation</a>
              </div>
              <p class="signature">
                Avec tout notre amour,
                <strong>Ruth &amp; Arnold</strong>
              </p>
              ${data.declineLink ? `
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e8dcc8;">
                <p style="font-size: 13px; color: #9A8E7E; margin-bottom: 12px;">Vous n'êtes plus disponible ?</p>
                <a href="${data.declineLink}" style="display: inline-block; background: transparent; color: #9A8E7E; padding: 10px 28px; text-decoration: none; border-radius: 20px; font-size: 13px; border: 1px solid #C8B8A0; letter-spacing: 0.5px;">Je ne pourrai pas être présent(e)</a>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>Golden Love 2026</p>
            </div>
          </div>
        </body>
      </html>
  `;
}

export async function sendGalaInvitationEmail(guestData: {
  email: string;
  firstName: string;
  lastName: string;
  galaLink: string;
  qrToken?: string;
}) {
  try {
    const domain = getDomain();
    const declineLink = guestData.qrToken
      ? `${domain}/api/rsvp/decline/${guestData.qrToken}`
      : null;

    const emailHtml = buildGalaEmailHtml({
      firstName: guestData.firstName,
      galaLink: guestData.galaLink,
      declineLink,
    });

    const info = await transporter.sendMail({
      from: `"Ruth & Arnold - Golden Love 2026" <${fromEmail}>`,
      to: guestData.email,
      subject: `${guestData.firstName}, votre invitation au mariage de Ruth & Arnold`,
      html: emailHtml,
    });

    console.log("Gala invitation email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send gala invitation email:", error);
    throw error;
  }
}

export async function sendInvitation21Email(guestData: {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  qrToken?: string;
}) {
  try {
    const domain = getDomain();
    const invitationLink = `${domain}/guest/${guestData.id}`;
    const declineLink = guestData.qrToken
      ? `${domain}/api/rsvp/decline/${guestData.qrToken}`
      : null;

    const emailHtml = buildInvitation21EmailHtml({
      firstName: guestData.firstName,
      invitationLink,
      declineLink,
    });

    const info = await transporter.sendMail({
      from: `"Ruth & Arnold - Golden Love 2026" <${fromEmail}>`,
      to: guestData.email,
      subject: `${guestData.firstName}, votre invitation du 21 mars est disponible !`,
      html: emailHtml,
    });

    console.log("Invitation 21 email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send invitation 21 email:", error);
    throw error;
  }
}

// ─── Reminder Email ────────────────────────────────────────────────────────

export function buildReminderEmailHtml(opts: {
  firstName: string;
  daysUntil: number;
  weddingDateLabel: string;
  confirmLink: string;
  declineLink: string;
}) {
  const { firstName, daysUntil, weddingDateLabel, confirmLink, declineLink } = opts;

  const urgencyText =
    daysUntil <= 0
      ? "C&#39;est le grand jour !"
      : daysUntil === 1
      ? "Dans 1 jour seulement !"
      : `Dans ${daysUntil} jours seulement !`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Confirmez-vous votre pr&#233;sence ?</title>
  <style type="text/css">
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #F5EFE6; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .wrapper { width: 100% !important; }
      .inner-td { padding: 28px 20px !important; }
      .btn-td { padding: 0 20px !important; }
      .header-td { padding: 36px 20px 28px !important; }
      .banner-td { padding: 12px 20px !important; }
      .quote-td { padding: 20px !important; }
      .footer-td { padding: 24px 20px !important; }
      h1 { font-size: 34px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F5EFE6;">

<!-- Outer wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5EFE6;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- Email card -->
      <table class="wrapper" width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;">

        <!-- ── HEADER ── -->
        <tr>
          <td class="header-td" align="center" bgcolor="#2C2418" style="background-color:#2C2418;padding:44px 40px 36px;border-radius:4px 4px 0 0;">
            <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#C8A96A;">
              GOLDEN LOVE 2026
            </p>
            <h1 style="margin:0 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-size:40px;font-weight:400;color:#FFFFFF;line-height:1.2;">
              Ruth &amp; Arnold
            </h1>
            <p style="margin:20px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C8A96A;">
              ${weddingDateLabel}
            </p>
          </td>
        </tr>

        <!-- ── GOLD BANNER ── -->
        <tr>
          <td class="banner-td" align="center" bgcolor="#B8943E" style="background-color:#B8943E;padding:14px 40px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FFFFFF;">
              &#10022; &nbsp; ${urgencyText} &nbsp; &#10022;
            </p>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td class="inner-td" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:44px 40px 36px;">

            <!-- Greeting -->
            <p style="margin:0 0 24px 0;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#2C2418;">
              Cher(e) ${firstName},
            </p>

            <!-- Para 1 -->
            <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.8;color:#5C4F3D;">
              Notre mariage approche &#224; grands pas et notre c&#339;ur d&#233;borde de joie &#224; l&#39;id&#233;e de partager ce moment unique avec vous.
            </p>

            <!-- Para 2 -->
            <p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.8;color:#5C4F3D;">
              Afin de finaliser nos pr&#233;paratifs &mdash; plan de table, traiteur, d&#233;coration &mdash; nous devons
              <strong style="color:#2C2418;">cl&#244;turer nos confirmations dans les 48&nbsp;heures</strong>.
            </p>

            <!-- Para 3 -->
            <p style="margin:0 0 36px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.8;color:#5C4F3D;">
              Pourriez-vous, s&#39;il vous pla&#238;t, nous indiquer si nous pouvons compter sur votre pr&#233;sence&nbsp;?
            </p>

            <!-- Divider -->
            <table width="80" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 36px auto;">
              <tr><td height="1" bgcolor="#C8A96A" style="font-size:1px;line-height:1px;">&nbsp;</td></tr>
            </table>

            <!-- ── CONFIRM BUTTON ── -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="btn-td" align="center" style="padding:0 40px 16px;">
                  <a href="${confirmLink}" style="display:block;background-color:#B8943E;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:18px 32px;border-radius:2px;">
                    &#10022; &nbsp; CONFIRMER MA PR&#201;SENCE &nbsp; &#10022;
                  </a>
                </td>
              </tr>
            </table>

            <!-- ── DECLINE LINK ── -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding:0 0 40px 0;">
                  <a href="${declineLink}" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8A7D6B;text-decoration:underline;letter-spacing:0.5px;">
                    Je ne pourrai malheureusement pas &#234;tre pr&#233;sent(e)
                  </a>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table width="80" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 36px auto;">
              <tr><td height="1" bgcolor="#C8A96A" style="font-size:1px;line-height:1px;">&nbsp;</td></tr>
            </table>

            <!-- Quote block -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="quote-td" bgcolor="#FBF7F1" style="background-color:#FBF7F1;border:1px solid #E8DCC8;padding:24px 28px;">
                  <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.8;color:#5C4F3D;font-style:italic;text-align:center;">
                    Votre r&#233;ponse, quelle qu&#39;elle soit, nous permettra d&#39;organiser cette journ&#233;e m&#233;morable dans les meilleures conditions.
                    Merci du fond du c&#339;ur.
                  </p>
                </td>
              </tr>
            </table>

            <br /><br />

            <!-- Signature -->
            <p style="margin:0 0 4px 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#8A7D6B;font-style:italic;text-align:center;">
              Avec tout notre amour,
            </p>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#B8943E;font-weight:400;text-align:center;">
              Ruth &amp; Arnold
            </p>

          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td class="footer-td" align="center" bgcolor="#2C2418" style="background-color:#2C2418;padding:24px 40px;border-radius:0 0 4px 4px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7A6E62;">
              GOLDEN LOVE 2026 &nbsp;&middot;&nbsp; BRUXELLES
            </p>
          </td>
        </tr>

      </table>
      <!-- /Email card -->

    </td>
  </tr>
</table>
<!-- /Outer wrapper -->

</body>
</html>`;
}

export async function sendReminderEmail(guestData: {
  firstName: string;
  lastName: string;
  email: string;
  availability: string;
  qrToken: string;
}) {
  const domain = process.env.DOMAIN || "https://ar2k26.com";

  // Calculate days until the relevant wedding date
  const now = new Date();
  const date19 = new Date("2026-03-19T00:00:00Z");
  const date21 = new Date("2026-03-21T00:00:00Z");

  let targetDate: Date;
  let weddingDateLabel: string;

  if (guestData.availability === "21-march") {
    targetDate = date21;
    weddingDateLabel = "21 mars 2026";
  } else {
    targetDate = date19;
    weddingDateLabel = "19 mars 2026";
  }

  const daysUntil = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const confirmLink = `${domain}/api/rsvp/confirm/${guestData.qrToken}`;
  const declineLink = `${domain}/api/rsvp/decline/${guestData.qrToken}`;

  const emailHtml = buildReminderEmailHtml({
    firstName: guestData.firstName,
    daysUntil,
    weddingDateLabel,
    confirmLink,
    declineLink,
  });

  const info = await transporter.sendMail({
    from: `"Ruth & Arnold - Golden Love 2026" <${fromEmail}>`,
    to: guestData.email,
    subject: `${guestData.firstName}, confirmez-vous votre présence ? ✦ ${daysUntil} jours !`,
    html: emailHtml,
  });

  console.log("Reminder email sent:", info.messageId);
  return info;
}
