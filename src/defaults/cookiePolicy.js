const defaultCookiePolicy = `<h1>Cookie Policy</h1>

<p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>

<h2>1. What Are Cookies</h2>
<p>Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.</p>

<h2>2. How We Use Cookies</h2>
<p>We use cookies for the following purposes:</p>
<ul>
    <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
    <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website</li>
    <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
    <li><strong>Analytics Cookies:</strong> Provide statistics on how our website is used</li>
</ul>

<h2>3. Types of Cookies We Use</h2>

<h3>3.1 Session Cookies</h3>
<p>These are temporary cookies that expire when you close your browser. They help us maintain your session while you navigate our website.</p>

<h3>3.2 Persistent Cookies</h3>
<p>These cookies remain on your device for a set period or until you delete them. They remember your preferences for future visits.</p>

<h3>3.3 Third-Party Cookies</h3>
<p>We may use third-party services (such as analytics providers) that set their own cookies. These help us improve our content and services.</p>

<h2>4. Managing Cookies</h2>
<p>You can control and manage cookies through your browser settings. Most browsers allow you to:</p>
<ul>
    <li>View what cookies are stored and delete them individually</li>
    <li>Block third-party cookies</li>
    <li>Block cookies from specific websites</li>
    <li>Delete all cookies when you close your browser</li>
    <li>Disable all cookies entirely</li>
</ul>

<p><strong>Note:</strong> Disabling cookies may affect the functionality of our website and limit your access to certain features.</p>

<h2>5. Browser-Specific Cookie Management</h2>
<ul>
    <li><strong>Google Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
    <li><strong>Mozilla Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
    <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
    <li><strong>Microsoft Edge:</strong> Settings → Site permissions → Cookies and site data</li>
</ul>

<h2>6. Cookie Categories</h2>

<table border="1" cellpadding="10">
    <tr>
        <th>Category</th>
        <th>Purpose</th>
        <th>Duration</th>
    </tr>
    <tr>
        <td>Essential</td>
        <td>Enable core functionality</td>
        <td>Session</td>
    </tr>
    <tr>
        <td>Functional</td>
        <td>Remember preferences</td>
        <td>1 year</td>
    </tr>
    <tr>
        <td>Analytics</td>
        <td>Understand site usage</td>
        <td>2 years</td>
    </tr>
</table>

<h2>7. Your Consent</h2>
<p>By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by changing your browser settings.</p>

<h2>8. Updates to This Policy</h2>
<p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>

<h2>9. Contact Us</h2>
<p>If you have questions about our use of cookies, please contact us through our <a href="/contact">Contact page</a>.</p>
`;

module.exports = defaultCookiePolicy;
