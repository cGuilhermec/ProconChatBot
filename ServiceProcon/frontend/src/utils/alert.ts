import Swal from "sweetalert2";

// Detecta se o sistema está em dark mode
const isDarkMode = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Configuração base do tema
const getThemeConfig = () => {
    const dark = isDarkMode();

    return {
        background: dark ? '#1c1c1e' : '#ffffff',
        color: dark ? '#ffffff' : '#000000',
        confirmButtonColor: '#007aff',
        cancelButtonColor: '#ff3b30',
        customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            htmlContainer: 'swal-custom-html',
            confirmButton: 'swal-custom-confirm',
            cancelButton: 'swal-custom-cancel',
        }
    };
};

export const showAlert = (
    title: string,
    text: string,
    icon: "success" | "error" | "info" | "warning" = "info"
) => {
    Swal.fire({
        title,
        text,
        icon,
        confirmButtonText: "OK",
        ...getThemeConfig(),
        backdrop: true,
    });
};

export const showConfirm = async (
    title: string,
    text: string,
    confirmText: string = "Sim",
    cancelText: string = "Cancelar"
): Promise<boolean> => {
    const result = await Swal.fire({
        title,
        text,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        ...getThemeConfig(),
    });

    return result.isConfirmed;
};

export const showToast = (
    title: string,
    icon: "success" | "error" | "info" | "warning" = "success",
    timer: number = 3000
) => {
    const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
        ...getThemeConfig(),
    });

    toast.fire({
        title,
        icon,
    });
};

// Para usar com loading
export const showLoading = (title: string = "Processando...") => {
    Swal.fire({
        title,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        },
        ...getThemeConfig(),
    });
};

export const closeLoading = () => {
    Swal.close();
};