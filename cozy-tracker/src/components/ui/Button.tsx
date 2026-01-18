import { cn } from "@/lib/utils"
import { motion, type HTMLMotionProps } from "framer-motion"
import React from "react"

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "danger" | "ghost"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", children, ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-white border-2 border-text shadow-hard hover:shadow-hard-sm",
            secondary: "bg-secondary text-white border-2 border-text shadow-hard hover:shadow-hard-sm",
            danger: "bg-accent text-white border-2 border-text shadow-hard hover:shadow-hard-sm",
            ghost: "bg-transparent text-text hover:bg-black/5",
        }

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.95, y: 2, x: 2, boxShadow: "0px 0px 0px 0px #E5E5E5" }}
                className={cn(
                    "px-4 py-2 rounded-xl font-bold transition-transform active:shadow-none flex items-center justify-center gap-2",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </motion.button>
        )
    }
)

Button.displayName = "Button"
