import { useMediaQuery } from "react-responsive";

const useResponsive = () => {
    const xs = useMediaQuery({
        query: `(max-width: 480px)`,
    });

    const sm = useMediaQuery({
        query: `(max-width: 768px)`,
    });

    const md = useMediaQuery({
        query: `(max-width: 1024px)`,
    });

    const lg = useMediaQuery({
        query: `(max-width: 1184px)`,
    });

    const xl = useMediaQuery({
        query: "(max-width: 1440px)",
    });

    return { xs, sm, lg, md, xl };
};

export default useResponsive;
