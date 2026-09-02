# Local workflow recovery

VeilZero persists no case, vendor key, report plaintext, wallet proof or recovery material. Closing or reloading the page clears those values. Resumption is explicit and local:

- a public program manifest can be imported after its canonical key and policy commitments are recomputed;
- a private vendor key package can be imported after strict schema/size checks and a live X25519 agreement proves that its public and private halves match;
- a researcher recovery package can be imported after strict schema/size checks, its domain-separated HMAC is recomputed, its AES-GCM ciphertext is authenticated without rendering plaintext, and its program binding, case/report/ciphertext commitments and Stark signing-key pair are independently recomputed.

Recovery package version 3 includes the program's X25519 **public** key so the browser can reproduce both the encryption-key binding and case commitment. It also authenticates the complete package with HMAC-SHA256 keyed by the case secret. This detects accidental field corruption and fails closed before the package is used. Because every authentication secret is necessarily inside the self-contained recovery file, the authenticator does not make an untrusted file authoritative and does not protect a stolen package from its holder.

Imports are read with the browser File API, retained only in React memory, never uploaded, and never written to `localStorage`, IndexedDB or logs. The UI renders only verification status and public identifiers. The vendor may explicitly decrypt a matching public envelope after its key package passes verification; that is the only action that renders report plaintext.

The recovery file contains the case secret, local envelope key, case signing private key and claim secret. The vendor key package contains the program X25519 private key. Store each offline, never commit either one, never send the researcher recovery file to the vendor, and do not show their JSON contents during the demo. These files are not password-wrapped in the MVP, and VeilZero cannot recover a lost file.
