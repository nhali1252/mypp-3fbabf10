export interface BootStage {
  stage: string;
  name: string;
  location: string;
  description: string;
  roleInSecurity: string;
}

export interface ExploitPath {
  id: string;
  title: string;
  targetFirmware: string;
  methodology: string;
  stepByStep: string[];
  safetyMechanism: string;
}

export interface BrandLockDetail {
  brand: string;
  lockType: string;
  unlockProtocol: string;
  hardwareSecurity: string;
  pitfalls: string;
  ourSolution: string;
}

export interface FaqItem {
  q: string;
  a: string;
  category: "General" | "Security & Banking" | "Xiaomi HyperOS" | "Samsung Knox" | "EDL & Unbrick";
}

export const BOOT_STAGES: BootStage[] = [
  {
    stage: "Stage 0",
    name: "Primary Bootloader (PBL) / Boot ROM",
    location: "Read-Only Memory (ROM) etched into CPU silicon",
    description: "The very first code executed when the SoC powers on. Hardcoded at the TSMC/Samsung foundry. Initializes CPU registers, detects boot media (UFS/eMMC storage), and validates the digital signature of the next stage.",
    roleInSecurity: "Root of Trust. If the signature check fails or test-points are detected, Qualcomm falls back to Emergency Download (EDL 9008) mode, while MediaTek falls back to BROM mode.",
  },
  {
    stage: "Stage 1",
    name: "Extensible Boot Loader (XBL) / SBL",
    location: "UFS xbl_a / xbl_b partition",
    description: "Initializes hardware infrastructure: DDR RAM controllers, Power Management IC (PMIC), clocks, and cryptographic accelerators. Loads TrustZone/TEE into secure memory.",
    roleInSecurity: "Cryptographically verified by PBL public keys burned into OEM e-fuses (Qfprom). Any bit alteration results in an immediate hard brick / EDL drop.",
  },
  {
    stage: "Stage 2",
    name: "TrustZone / TEE (Secure World)",
    location: "Dedicated hardware-isolated RAM slice",
    description: "ARM TrustZone OS running Qualcomm QSEE or Samsung TEE. Manages Keymaster, Gatekeeper, fingerprint/biometrics sensor data, and RPMB (Replay Protected Memory Block).",
    roleInSecurity: "Holds the encryption master keys for user data. Controls the hardware warranty e-fuses and authenticates bootloader state queries.",
  },
  {
    stage: "Stage 3",
    name: "Android Boot Loader (ABL) / Little Kernel",
    location: "abl_a / abl_b partition",
    description: "The stage you interact with when in 'Fastboot Mode'. Implements the USB Fastboot protocol, parses kernel command lines, checks the OEM unlock flag in persistent data (devinfo partition).",
    roleInSecurity: "Evaluates Android Verified Boot (AVB 2.0). If unlocked, it allows booting custom kernels, displays the 'Orange State' boot warning, and skips OEM signature enforcement.",
  },
  {
    stage: "Stage 4",
    name: "Linux Kernel & Init Ramdisk",
    location: "boot, vendor_boot, and init_boot partitions",
    description: "Loads the Linux kernel into memory, executes early driver probing, mounts the dm-verity protected root filesystem (`/system`), and executes `/system/bin/init` (PID 1).",
    roleInSecurity: "dm-verity validates cryptographic hash trees for every single disk block read from system, vendor, and product partitions. If verified boot fails in locked state, boot stops with RED state error.",
  },
];

export const EXPLOIT_PATHS: ExploitPath[] = [
  {
    id: "low-version",
    title: "Low Version Path (MIUI & Early HyperOS)",
    targetFirmware: "MIUI 14 & Early HyperOS 1.0 builds",
    methodology: "Kernel commandline injection via fastboot GPU preemption override + MIUI system service IPC privilege escalation.",
    stepByStep: [
      "1. Device boots to Fastboot mode.",
      "2. Issue command: fastboot oem set-gpu-preemption 0 androidboot.selinux=permissive",
      "3. Issue command: fastboot continue (Boots into Android OS with SELinux Permissive mode active).",
      "4. Push engineering bootloader: adb push abl.elf /data/local/tmp/",
      "5. Exploit MIUI QAS service: adb shell service call miui.mqsas.IMQSNative 21 i32 1 s16 \"dd\" i32 1 s16 'if=/data/local/tmp/abl.elf of=/dev/block/by-name/abl_a' s16 '/data/mqsas/log.txt' i32 60",
      "6. Repeat dd write to abl_b partition and reboot into fastboot mode with unlocked engineering ABL.",
    ],
    safetyMechanism: "SELinux permissive mode allows root-level IPC calls without modifying system partition signatures.",
  },
  {
    id: "high-version",
    title: "High Version Path (HyperOS 3.0.302 - 3.0.306, AJ, BJ)",
    targetFirmware: "HyperOS 3.0.302, 3.0.303, 3.0.305, 3.0.306, AJ, BJ builds",
    methodology: "Kernel-level privilege escalation via automated memory scanning (flash_abl.ps1) + atomic dd partition write.",
    stepByStep: [
      "1. Push exploit binary to /data/local/tmp/exploit and engineering abl.elf.",
      "2. PowerShell script (flash_abl.ps1) executes exploit via ADB shell in an asynchronous process loop.",
      "3. Dynamically scans live memory stream for kernel symbol table: 'Kallsyms parsed successfully'.",
      "4. Disables SELinux runtime enforcement: 'SELinux enforcing disabled'.",
      "5. Confirms root shell acquisition (UID: 0 / euid=0(root)).",
      "6. Issues atomic dd commands: dd if=/data/local/tmp/abl.elf of=/dev/block/by-name/abl_a bs=4096 conv=fsync",
      "7. Syncs storage, outputs FLASH_DONE, and reboots directly into Fastboot mode.",
    ],
    safetyMechanism: "Includes watchdog stall detection (120s no-progress timeout) and hard ceiling (900s) to prevent system instability.",
  },
  {
    id: "temp-bl-suite",
    title: "Temp BL Mode & Engineering Firmware Stack",
    targetFirmware: "Snapdragon 8 Gen 2/3/4 & Snapdragon 8 Elite (SM8750 / SM8850)",
    methodology: "Flashing the complete 22-partition engineering bootloader suite + partition table switching + custom memory payload boot.",
    stepByStep: [
      "1. Fastboot erase frp and erase boot_ab.",
      "2. Flash engineering partition stack: abl_ab, xbl_ab, tz_ab, keymint_ab, hyp_ab, uefi_ab, cpucp_ab, imagefv_ab, init_boot_ab, vendor_boot_ab, dtbo_ab, vbmeta_system_ab.",
      "3. Flash temporary partition table: fastboot flash partition:4 gpt_both4.bin",
      "4. Boot custom unlock payload into RAM: fastboot boot Unlocking-SM8650.img (or SM8750 / SM8850).",
      "5. The payload executes in RAM and writes the genuine unlock flag into persistent devinfo storage.",
      "6. Verify unlock status: fastboot getvar unlocked -> unlocked: yes!",
      "7. Flash back stock partition table (gpt_both4.bin), restore stock abl_a.img / abl_b.img, and flash misc_wipe.img.",
      "8. Fastboot oem device-info confirms device is permanently unlocked and reboots normally into OS.",
    ],
    safetyMechanism: "100% reversible: the stock partition table and stock ABL images are restored before final reboot, ensuring OTA and system stability remain factory-clean.",
  },
];

export const BRAND_LOCK_DETAILS: BrandLockDetail[] = [
  {
    brand: "Xiaomi / Redmi / Poco (HyperOS & Ali EDL Flasher)",
    lockType: "Server-token encrypted Fastboot + Account Tiering",
    unlockProtocol: "Ali One-Click Unlocker & GhostAuth API (https://api.alii.uk)",
    hardwareSecurity: "Qualcomm / MediaTek secure boot + Mi Account hardware bind token stored in nvram/persist",
    pitfalls: "HyperOS introduced severe restrictions in 2024: Mi Community account must be Level 5 in China or >30 days registered globally. Daily quota limits often trigger 'Server error 30001' or 'Quota exhausted'.",
    ourSolution: "Ali EDL Flasher & GhostAuth Suite. Direct server token injection and kernel privilege escalation (flash_abl.ps1) that completely bypasses community levels, allowing immediate unlocking across all Snapdragon 8 Elite, Gen 3, Gen 2, 7s Gen 3, and MTK chipsets.",
  },
  {
    brand: "Samsung (Knox Warranty Architecture)",
    lockType: "CROM Service + Knox Micro-fuse laser bit",
    unlockProtocol: "Samsung Odin Download Mode protocol",
    hardwareSecurity: "Physical hardware e-fuse (Knox bit 0x0). Blown to 0x1 permanently when an uncertified kernel executes.",
    pitfalls: "US Carrier & Factory Unlocked models (SM-S9xxU/U1) have locked bootloader keys enforced by Qualcomm Secure Boot with no OEM Unlock toggle. Global models (B/DS) unlock easily but trip Knox permanently.",
    ourSolution: "Safe OEM Unlock & Root setup for Global/European/Exynos/Snapdragon B-variants with automated Play Integrity & Knox-replacement patches (KnoxPatch) so apps work seamlessly.",
  },
  {
    brand: "Google Pixel (Pure AOSP Standard)",
    lockType: "Pure Fastboot Open Standard",
    unlockProtocol: "`fastboot flashing unlock` / `fastboot flashing unlock_critical`",
    hardwareSecurity: "Titan M2 security chip + AVB 2.0 key store. Zero permanent hardware fuses blown.",
    pitfalls: "Verizon carrier models (sold through Verizon stores or Verizon MVNOs) have `sys.oem_unlock_allowed` forced to 0 permanently in carrier partition.",
    ourSolution: "Instant 5-minute unlocking guidance and automated script setup for all Factory Unlocked Google Pixel 6, 7, 8, and 9 series devices with GrapheneOS / LineageOS / KernelSU support.",
  },
  {
    brand: "Qualcomm EDL 9008 (Emergency Download)",
    lockType: "Sahara Protocol + Firehose XML Programmer",
    unlockProtocol: "Direct Raw NAND/UFS Sector Access via USB VID_05C6&PID_9008",
    hardwareSecurity: "Qualcomm PK Hash (PBL Public Key Hash) burned into SoC Qfprom fuses at factory",
    pitfalls: "Modern chipsets (Snapdragon 8 Gen 1/2/3, 7+ Gen 2) require VIP digitally signed programmer files (`prog_firehose_ddr.elf`) signed with OEM private keys. Generic Sahara loaders are rejected.",
    ourSolution: "Ali_EDL_Flasher.exe VIP Server access. We load authenticated OEM programmers to recover hard-bricked devices, repair erased GPT partition tables, and perform cross-region flashing.",
  },
  {
    brand: "MediaTek BROM (Boot ROM Exploit)",
    lockType: "Watchdog timer crash + SLA / DAA Auth",
    unlockProtocol: "MediaTek USB COM Port Handshake (BROM Mode)",
    hardwareSecurity: "Boot ROM Signature Checking with Hardware Crypto Engine",
    pitfalls: "Recent Dimensity 8000/9000 chipsets require dynamic server challenge responses (DAA) to allow partition flashing through SP Flash Tool.",
    ourSolution: "Direct MTK BROM exploit payload delivery and authorized Download Agent server sessions for instant unbrick and partition dumping.",
  },
  {
    brand: "Sony Xperia (Trim Area DRM)",
    lockType: "S1 Bootloader Protocol + TA Partition",
    unlockProtocol: "Sony Developer World unlock key (`fastboot oem unlock 0x<KEY>`)",
    hardwareSecurity: "Unique device unlock key derived from IMEI and stored in OTP fuses",
    pitfalls: "Unlocking without backing up the Trim Area (TA partition) permanently destroys Sony proprietary camera noise-reduction and BIONZ X image processing algorithms.",
    ourSolution: "Pre-unlock TA partition backup protocol to preserve proprietary DRM keys, enabling camera quality restoration even on custom AOSP ROMs.",
  },
];

export const AVB_STATES = [
  {
    state: "Green State",
    label: "LOCKED & VERIFIED",
    color: "emerald",
    desc: "The device has booted using the OEM's cryptographic root certificate. All partitions are 100% genuine and verified via AVB 2.0 hash trees. Full Widevine L1, Google Pay, and Knox security intact.",
  },
  {
    state: "Orange State",
    label: "UNLOCKED / CUSTOM KERNEL",
    color: "amber",
    desc: "The bootloader is unlocked. The device displays a 5-second warning screen during boot: 'Your device has been unlocked and can't be trusted'. Custom boot.img, recoveries, and modified system partitions can boot.",
  },
  {
    state: "Yellow State",
    label: "CUSTOM ROOT CERTIFICATE",
    color: "yellow",
    desc: "The device is locked using a user-provided root of trust (`avb_custom_key`). Used by hardened operating systems like GrapheneOS on Google Pixel to provide locked Verified Boot security with custom ROMs.",
  },
  {
    state: "Red State",
    label: "CORRUPTED OR VERIFICATION FAILURE",
    color: "rose",
    desc: "The device is in locked mode, but `vbmeta` or kernel hash verification failed (e.g. system was modified while bootloader was relocked). Device refuses to boot into OS to protect data integrity.",
  },
];

export const FASTBOOT_COMMANDS = [
  {
    cmd: "adb reboot bootloader",
    desc: "Reboots any connected Android phone with USB debugging into Fastboot mode.",
  },
  {
    cmd: "fastboot devices",
    desc: "Verifies USB handshake with the device in Fastboot mode. Shows serial number.",
  },
  {
    cmd: "fastboot oem set-gpu-preemption 0 androidboot.selinux=permissive",
    desc: "Ali Low-Version Exploit: Sets permissive SELinux flags in Qualcomm bootloader memory.",
  },
  {
    cmd: "fastboot continue",
    desc: "Boots device from fastboot without modifying on-disk partitions (used with permissive flag injection).",
  },
  {
    cmd: "fastboot flashing unlock",
    desc: "The universal Android standard command (Pixel, Nothing, OnePlus, Transsion) to unlock user partitions.",
  },
  {
    cmd: "fastboot oem get_unlock_data",
    desc: "Retrieves the cryptographic unlock string on Motorola and Sony devices for portal key generation.",
  },
  {
    cmd: "fastboot flash partition:4 gpt_both4.bin",
    desc: "Flashes modified engineering partition table to allow custom unlock image execution in RAM.",
  },
  {
    cmd: "fastboot boot Unlocking-SM8650.img",
    desc: "Boots the custom memory payload that writes genuine unlock state into persistent devinfo storage.",
  },
  {
    cmd: "fastboot getvar unlocked",
    desc: "Queries the bootloader unlock status: returns 'unlocked: yes' upon successful payload execution.",
  },
  {
    cmd: "fastboot flash vbmeta --disable-verity --disable-verification vbmeta.img",
    desc: "Flashes empty vbmeta flags to disable dm-verity, allowing modified vendor/system partitions to boot without bootloop.",
  },
];

export const FAQS: FaqItem[] = [
  {
    category: "General",
    q: "What is the Ali One-Click Unlocker & GhostAuth suite?",
    a: "It is an engineering firmware suite developed by Ali (supported via api.alii.uk and Telegram @nisa_jan). It automates bootloader unlocking for modern Xiaomi, Redmi, and POCO devices across Snapdragon 8 Elite, Gen 3, Gen 2, 7s Gen 3, and MTK chipsets without the 30-day Mi Community account delay.",
  },
  {
    category: "Xiaomi HyperOS",
    q: "How does the HyperOS high-version exploit (flash_abl.ps1) work?",
    a: "Modern HyperOS versions (3.0.302 through 3.0.306, AJ, and BJ) patch standard ADB vulnerabilities. Our tool pushes a specialized kernel privilege escalation binary, parses kernel memory structures (kallsyms), disables SELinux enforcement in runtime, acquires root UID: 0, and writes an engineering abl.elf to the abl_a and abl_b partitions before dropping into fastboot mode.",
  },
  {
    category: "General",
    q: "Will unlocking the bootloader wipe my personal data?",
    a: "YES, ALWAYS. Every Android bootloader unlock triggers an automatic cryptographic factory reset. This is a mandatory security design of Android Verified Boot to ensure that if a lost phone is stolen, the finder cannot unlock the bootloader to read your encrypted photos, messages, or apps without your passcode.",
  },
  {
    category: "Security & Banking",
    q: "Will my banking apps and Google Wallet still work after unlocking?",
    a: "Out of the box, Google Play Integrity API checks for an unlocked bootloader and reports MEETS_DEVICE_INTEGRITY=false. However, using KernelSU or APatch with modern PlayIntegrityFix modules, device integrity can be completely spoofed back to passing state, allowing Google Wallet, banking apps, and Netflix to work flawlessly.",
  },
  {
    category: "Samsung Knox",
    q: "Can a tripped Samsung Knox (0x1) ever be reset back to 0x0?",
    a: "NO. Samsung Knox is a physical microscopic hardware e-fuse on the SoC silicon. When an unofficial kernel or recovery is booted, Samsung firmware sends a high-current electrical pulse through the fuse, physically severing the microscopic circuit. However, KnoxPatch modules can restore app functionality like Secure Folder and Samsung Health.",
  },
  {
    category: "Samsung Knox",
    q: "Why can't US Snapdragon Samsung Galaxy phones (S24, S23, S22) be unlocked?",
    a: "Samsung models ending in 'U' or 'U1' (North American carriers and USA factory unlocked) have their bootloader signing keys locked with Qualcomm Secure Boot and hardware QFPROM fuses. Samsung USA does not provide an OEM Unlock toggle and does not sign unlock tokens for North American variants due to carrier contracts.",
  },
  {
    category: "EDL & Unbrick",
    q: "What is Qualcomm EDL 9008 Mode and how does Ali_EDL_Flasher.exe revive dead phones?",
    a: "Emergency Download (EDL) Mode is Qualcomm's lowest-level silicon recovery mode (USB ID 05C6:9008). It runs directly from the Primary Bootloader in Mask ROM before storage or RAM are even initialized. Ali_EDL_Flasher.exe uses VIP signed Firehose programmers to write raw partition images directly to UFS storage to recover bricked devices.",
  },
  {
    category: "General",
    q: "Can I re-lock the bootloader later to regain warranty or sell the phone?",
    a: "Yes! On Google Pixel, Xiaomi, Nothing Phone, and Motorola, you can flash the official stock factory firmware back to all partitions and execute fastboot flashing lock or use the official flash tool to return the phone to 100% factory locked state with genuine green verified boot.",
  },
];
