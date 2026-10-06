(() => {
  const host = document.getElementById('ecosystemSection');
  if (!host || document.getElementById('xrpetOfficialContacts')) return;

  const block = document.createElement('section');
  block.id = 'xrpetOfficialContacts';
  block.className = 'xrpet-contact-directory';
  block.setAttribute('aria-labelledby', 'xrpetContactsTitle');
  block.innerHTML = `
    <div class="xrpet-contact-head">
      <div>
        <span class="eyebrow">OFFICIAL PUBLIC CHANNELS // VERIFIED</span>
        <h2 id="xrpetContactsTitle">Ripple, XRPL & ecosystem connections</h2>
        <p>Public ways to contact organizations around the XRP Ledger ecosystem. XRPet is independent; listing a resource here does not claim sponsorship, endorsement, or a partnership with XRPet.</p>
      </div>
      <span class="truth-label">SOURCE-LINKED</span>
    </div>

    <div class="xrpet-contact-grid">
      <article class="xrpet-contact-card">
        <span class="xrpet-contact-type">RIPPLE LABS INC.</span>
        <h3>Corporate & business</h3>
        <p><strong>Mailing address</strong><br>600 Battery Street<br>San Francisco, CA 94111<br>U.S.A.</p>
        <div class="xrpet-contact-actions">
          <a href="https://ripple.com/contact/" target="_blank" rel="noopener noreferrer">Contact Ripple ↗</a>
          <a href="https://ripple.com/contact/sales/" target="_blank" rel="noopener noreferrer">Sales ↗</a>
        </div>
        <small>Use Ripple's official contact page for sales, press and partnership inquiries.</small>
      </article>

      <article class="xrpet-contact-card">
        <span class="xrpet-contact-type">RIPPLE // PARTNERSHIPS</span>
        <h3>Partnership inquiries</h3>
        <p>Ripple's official contact hub includes a dedicated <strong>Partnership Team</strong> route for organizations interested in working with Ripple.</p>
        <div class="xrpet-contact-actions">
          <a href="https://ripple.com/contact/" target="_blank" rel="noopener noreferrer">Contact Partnerships ↗</a>
          <a href="https://ripple.com/customers/" target="_blank" rel="noopener noreferrer">Customer network ↗</a>
        </div>
        <small>XRPet does not imply that listed companies are XRPet partners.</small>
      </article>

      <article class="xrpet-contact-card">
        <span class="xrpet-contact-type">RIPPLE // SUPPORT CHANNEL</span>
        <h3>Complaints & regulated support</h3>
        <p><strong>U.S. complaints phone</strong><br><a href="tel:+18008874084">+1 (800) 887-4084</a></p>
        <p><strong>Email</strong><br><a href="mailto:complaints@ripple.com">complaints@ripple.com</a></p>
        <div class="xrpet-contact-actions">
          <a href="https://ripple.com/legal/complaints-dispute-resolution/" target="_blank" rel="noopener noreferrer">Complaint process ↗</a>
        </div>
        <small>This number is published by Ripple for complaints; it is not labeled as a general corporate phone line.</small>
      </article>

      <article class="xrpet-contact-card">
        <span class="xrpet-contact-type">XRP LEDGER COMMUNITY</span>
        <h3>Developer help & contribution</h3>
        <p>XRPL is open-source and community-driven. The official community page routes builders to Discord, the newsletter, events, security reporting and community channels.</p>
        <div class="xrpet-contact-actions">
          <a href="https://xrpl.org/community" target="_blank" rel="noopener noreferrer">XRPL Community ↗</a>
          <a href="https://github.com/XRPLF/rippled" target="_blank" rel="noopener noreferrer">XRPL GitHub ↗</a>
        </div>
        <small>No general XRPL phone number is presented here because the official developer resources emphasize community and open-source channels.</small>
      </article>

      <article class="xrpet-contact-card">
        <span class="xrpet-contact-type">XRPL BUILDERS</span>
        <h3>Funding, acceleration & ecosystem programs</h3>
        <p>Official XRPL builder resources include RippleX ecosystem programs, XRPL Commons, grants, accelerators, hackathons and technical mentorship.</p>
        <div class="xrpet-contact-actions">
          <a href="https://xrpl.org/community/developer-funding" target="_blank" rel="noopener noreferrer">Builder programs ↗</a>
          <a href="https://xrpl.org/resources" target="_blank" rel="noopener noreferrer">Developer resources ↗</a>
        </div>
        <small>Use these routes for project support, grants and ecosystem participation.</small>
      </article>

      <article class="xrpet-contact-card">
        <span class="xrpet-contact-type">XRPL ECOSYSTEM</span>
        <h3>Projects, tools & integrations</h3>
        <p>Browse current wallets, infrastructure, developer tools, exchanges, gaming projects, custody providers and other XRPL-connected services.</p>
        <div class="xrpet-contact-actions">
          <a href="https://xrpl.org/resources" target="_blank" rel="noopener noreferrer">Ecosystem directory ↗</a>
          <a href="https://xrpl.org/develop" target="_blank" rel="noopener noreferrer">Integration points ↗</a>
        </div>
        <small>Individual organizations should be contacted through their own official published channels.</small>
      </article>
    </div>

    <div class="xrpet-contact-foot">
      <span>Last verified: October 6, 2026</span>
      <button id="xrpetCopyRippleAddress" type="button" class="secondary">Copy Ripple address</button>
    </div>
  `;

  const lower = host.querySelector('.ecosystem-lower-grid');
  if (lower) host.insertBefore(block, lower);
  else host.appendChild(block);

  const copyButton = document.getElementById('xrpetCopyRippleAddress');
  copyButton?.addEventListener('click', async () => {
    const text = 'Ripple Labs Inc.\n600 Battery Street\nSan Francisco, CA 94111\nU.S.A.';
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = 'Address copied';
      setTimeout(() => { copyButton.textContent = 'Copy Ripple address'; }, 1800);
    } catch {
      copyButton.textContent = 'Copy unavailable';
    }
  });

  const style = document.createElement('style');
  style.textContent = `
    .xrpet-contact-directory{margin-top:24px;padding:24px;border:1px solid rgba(255,255,255,.09);border-radius:22px;background:rgba(6,10,15,.78)}
    .xrpet-contact-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:18px}
    .xrpet-contact-head h2{margin:.35rem 0 .45rem}
    .xrpet-contact-head p{max-width:820px;margin:0;color:var(--muted,#96a0ad);line-height:1.6}
    .xrpet-contact-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .xrpet-contact-card{min-width:0;padding:18px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(255,255,255,.025)}
    .xrpet-contact-card h3{margin:.45rem 0 .75rem;font-size:1.05rem}
    .xrpet-contact-card p{color:var(--muted,#a3acb7);line-height:1.55}
    .xrpet-contact-card a{color:inherit}
    .xrpet-contact-type{font-size:.68rem;letter-spacing:.12em;opacity:.7}
    .xrpet-contact-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
    .xrpet-contact-actions a{display:inline-flex;padding:8px 10px;border:1px solid rgba(255,255,255,.11);border-radius:999px;text-decoration:none}
    .xrpet-contact-actions a:hover{background:rgba(255,255,255,.07)}
    .xrpet-contact-card small{display:block;opacity:.64;line-height:1.45}
    .xrpet-contact-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.07)}
    .xrpet-contact-foot span{font-size:.78rem;opacity:.62}
    @media(max-width:980px){.xrpet-contact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:650px){.xrpet-contact-head{display:block}.xrpet-contact-grid{grid-template-columns:1fr}.xrpet-contact-foot{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(style);
})();