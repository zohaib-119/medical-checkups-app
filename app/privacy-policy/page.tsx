// app/privacy-policy/page.tsx

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

            <p className="text-sm text-muted-foreground mb-6">Last updated: July 9, 2025</p>

            <p className="mb-4">
                This privacy policy explains how we handle your data during your use of our data
                collection system for healthcare research purposes. Please read this policy
                carefully to understand your rights and how your information will be used.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">1. What Information We Collect</h2>
            <ul className="list-disc list-inside mb-4">
                <li>Audio recordings of doctor-patient conversations</li>
                <li>Textual information entered by doctors (e.g., symptoms, treatments, notes)</li>
                <li>Basic patient identifiers (only if needed for context, e.g., initials)</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-2">2. Purpose of Data Collection</h2>
            <p className="mb-4">
                The collected data will be used exclusively for academic research and prototype
                development focused on conversational AI systems in healthcare. Our goal is to
                train language models to extract meaningful medical information, such as symptoms
                and treatment suggestions, from spoken interactions.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Security</h2>
            <p className="mb-2">
                This project is in a prototyping phase as part of a university research project.
                As such:
            </p>
            <ul className="list-disc list-inside mb-4">
                <li>
                    <span className="font-medium">No encryption is currently applied</span> to audio
                    or text data, either at rest or in transit.
                </li>
                <li>
                    All data is stored in a private, access-controlled environment with limited
                    access to the development team and supervisor.
                </li>
                <li>
                    De-identification is applied where feasible, but full anonymization is not
                    guaranteed.
                </li>
            </ul>
            <p className="mb-4">
                ⚠️ <span className="font-medium">Note:</span> Since encryption is not implemented,
                data leakage risks exist. We encourage future iterations of this system to adopt
                modern encryption standards for both storage and transmission.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">4. Your Rights</h2>
            <ul className="list-disc list-inside mb-4">
                <li>You may request details on how your data is being used.</li>
                <li>You can ask us to delete your data at any time without giving a reason.</li>
                <li>Your participation is voluntary, and consent can be withdrawn any time.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-2">5. Consent</h2>
            <p className="mb-4">
                By submitting your information through our system, you provide informed consent
                for the collection and use of your data for academic and research purposes, in
                accordance with this policy.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">6. Changes to This Policy</h2>
            <p className="mb-4">
                This privacy policy is subject to change without prior notice. Any future changes
                will be reflected on this page with an updated "Last Updated" date. We recommend
                reviewing this policy periodically.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">7. Contact</h2>
            <p className="mb-4">
                For any questions, requests, or concerns about your data, please contact the
                supervising instructor at{" "}
                <a
                    href="mailto:your-email@example.com"
                    className="text-primary underline hover:text-primary/80"
                >
                    notify.hms@gmail.com
                </a>
                .
            </p>
        </div>
    );
}
