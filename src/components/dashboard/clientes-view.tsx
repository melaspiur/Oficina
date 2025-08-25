"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ClienteDialog } from "./cliente-dialog"
import type { Cliente, ClienteWithId } from "@/lib/types"
import { addCliente, getClientes, updateCliente, deleteCliente } from "@/lib/services/clientes"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

const initialClientes: ClienteWithId[] = [
    { id: "1", codigo: 7, nombre: "ASOCIACION MUTUAL DE EMPLEADOS", domicilio: "H. YRIGOYEN 748", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-61771297-7", tipo: "inscripto", categoria: 4 },
    { id: "2", codigo: 9, nombre: "BAHL ALBERTO JOSE", domicilio: "9 DE JULIO S/N", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05500342-5", tipo: "monotributo", categoria: 2 },
    { id: "3", codigo: 10, nombre: "CANERO BETTINA LETICIA", domicilio: "25 DE MAYO 621", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-20425766-9", tipo: "monotributo", categoria: 2 },
    { id: "4", codigo: 13, nombre: "CIRCUITO TV. PUAN S.A.", domicilio: "LAVALLE 61", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-61233577-6", tipo: "monotributo", categoria: 2 },
    { id: "5", codigo: 14, nombre: "COOP. ELECTRICA DE PUAN", domicilio: "LAVALLE 61", localidad: "Carhue", provincia: "Buenos Aires", cuit: "33-54569474-9", tipo: "monotributo", categoria: 2 },
    { id: "6", codigo: 15, nombre: "CO.S.S.M.A.", domicilio: "9 DE JULIO S/N", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-54580226-7", tipo: "monotributo", categoria: 2 },
    { id: "7", codigo: 17, nombre: "EL REENCUENTRO S.A.", domicilio: "AV. COLON 1247", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-63769700-1", tipo: "monotributo", categoria: 2 },
    { id: "8", codigo: 19, nombre: "FABBIAN FABIO LUIS", domicilio: "SAN MARTIN 1165", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-10688033-7", tipo: "monotributo", categoria: 3 },
    { id: "9", codigo: 20, nombre: "FABBIAN LILIANA ROSA", domicilio: "SAN MARTIN 1165", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-11534034-4", tipo: "inscripto", categoria: 1 },
    { id: "10", codigo: 21, nombre: "FABBIAN S.C.A.", domicilio: "SAN MARTIN 1165", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-50938401-7", tipo: "monotributo", categoria: 2 },
    { id: "11", codigo: 23, nombre: "FERNANDEZ DOMINGO", domicilio: "CASILLA CORREO 109", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05428382-3", tipo: "monotributo", categoria: 3 },
    { id: "12", codigo: 24, nombre: "FERNANDEZ DOMINGO Y FRANCISCO", domicilio: "CASILLA CORREO 109", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-60398194-0", tipo: "monotributo", categoria: 2 },
    { id: "13", codigo: 25, nombre: "FERNANDEZ FRANCISCO", domicilio: "CASILLA CORREO 109", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-01572099-9", tipo: "monotributo", categoria: 3 },
    { id: "14", codigo: 26, nombre: "FU.A.A.S.A.", domicilio: "25 DE MAYO 1025", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-64522076-1", tipo: "monotributo", categoria: 2 },
    { id: "15", codigo: 27, nombre: "FUHR HORACIO OSCAR", domicilio: "AVELLANEDA 635", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05516157-8", tipo: "monotributo", categoria: 2 },
    { id: "16", codigo: 28, nombre: "GARCIA ADOLFO", domicilio: "MITRE 1246", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-01294090-5", tipo: "monotributo", categoria: 2 },
    { id: "17", codigo: 29, nombre: "GARCIA DANIEL ADOLFO", domicilio: "MITRE 1246", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-14528223-4", tipo: "monotributo", categoria: 2 },
    { id: "18", codigo: 32, nombre: "ELIMINADO", domicilio: "AV. COLON 1247", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-62675826-2", tipo: "monotributo", categoria: 2 },
    { id: "19", codigo: 36, nombre: "INCHAUSPE HORACIO HECTOR", domicilio: "SAN MARTIN 1000", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-13705216-5", tipo: "monotributo", categoria: 2 },
    { id: "20", codigo: 37, nombre: "IRIARTE DANIEL HORACIO", domicilio: "COLON Y BELGRANO", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-16715995-9", tipo: "monotributo", categoria: 2 },
    { id: "21", codigo: 44, nombre: "LACOMBE JOSE LUIS", domicilio: "CASILLA CORREO 48", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-12230822-8", tipo: "monotributo", categoria: 2 },
    { id: "22", codigo: 45, nombre: "LEIBOLD LUIS JUAN", domicilio: "25 DE MAYO 960", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05501708-6", tipo: "monotributo", categoria: 2 },
    { id: "23", codigo: 46, nombre: "LEIBOLD MARCELO OSCAR", domicilio: "25 DE MAYO 960", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05399182-4", tipo: "monotributo", categoria: 3 },
    { id: "24", codigo: 48, nombre: "LIENAHRD ERNESTO DOMINGO", domicilio: "H. YRIGOYEN 198", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-13649994-8", tipo: "monotributo", categoria: 2 },
    { id: "25", codigo: 49, nombre: "LOPEZ OMAR FERNANDO", domicilio: "MITRE 669", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-14528144-0", tipo: "monotributo", categoria: 2 },
    { id: "26", codigo: 51, nombre: "MARTIN MARIA CONCEPCION", domicilio: "MITRE 1246", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-02207319-8", tipo: "monotributo", categoria: 3 },
    { id: "27", codigo: 52, nombre: "MAUGERI BRUNO", domicilio: "MORENO 757", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-17360565-0", tipo: "monotributo", categoria: 3 },
    { id: "28", codigo: 54, nombre: "MAUGERI DANIEL FELIPE", domicilio: "MORENO 757", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05443234-9", tipo: "monotributo", categoria: 2 },
    { id: "29", codigo: 55, nombre: "MAYER SERGIO ADRIAN", domicilio: "SAN MARTIN 1377", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-18051691-4", tipo: "monotributo", categoria: 2 },
    { id: "30", codigo: 56, nombre: "MILLA HECTOR OSCAR", domicilio: "AV. COLON 1247", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05501746-9", tipo: "monotributo", categoria: 2 },
    { id: "31", codigo: 60, nombre: "MORO ENRIQUE OMAR", domicilio: "MORENO 287", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-10572037-9", tipo: "monotributo", categoria: 2 },
    { id: "32", codigo: 61, nombre: "NARBAITZ MARIA VIRGINIA", domicilio: "H. YRIGOYEN 609", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-11652051-1", tipo: "monotributo", categoria: 2 },
    { id: "33", codigo: 62, nombre: "NARBAITZ RICARDO", domicilio: "H. YRIGOYEN 609", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-04243760-4", tipo: "inscripto", categoria: 1 },
    { id: "34", codigo: 64, nombre: "PAGGI NORBERTO RAUL", domicilio: "PEDRO GALLO 746", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05501702-7", tipo: "monotributo", categoria: 2 },
    { id: "35", codigo: 66, nombre: "PERALTA ROSA MARIA", domicilio: "CASA 154 B.ILLIA", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-14983264-0", tipo: "monotributo", categoria: 2 },
    { id: "36", codigo: 67, nombre: "PIÑEIRO MARIANO ALFREDO", domicilio: "DEL SIGNO 4039 5 F", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05375303-6", tipo: "monotributo", categoria: 3 },
    { id: "37", codigo: 69, nombre: "PRODUCTOS BONAERENSES S.A.", domicilio: "COLON 1310", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-66466172-8", tipo: "monotributo", categoria: 2 },
    { id: "38", codigo: 70, nombre: "RAFFIN CARLOS ALBERTO", domicilio: "RIVADAVIA 560", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05495401-9", tipo: "monotributo", categoria: 2 },
    { id: "39", codigo: 73, nombre: "ROSSO CARLOS FEDERICO", domicilio: "ZONA RURAL", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-04216700-3", tipo: "monotributo", categoria: 2 },
    { id: "40", codigo: 75, nombre: "ROSSO ARTEAGA MARIA MERCEDES", domicilio: "CASILLA CORREO 50", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-22100624-6", tipo: "monotributo", categoria: 2 },
    { id: "41", codigo: 79, nombre: "SAGASTI ALDO Y GUILLERMO", domicilio: "AV. COLON 1033", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-66464312-6", tipo: "monotributo", categoria: 2 },
    { id: "42", codigo: 82, nombre: "SOCIEDAD RURAL ADOLFO ALSINA", domicilio: "SAN MARTIN 736", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-56387863-7", tipo: "inscripto", categoria: 4 },
    { id: "43", codigo: 86, nombre: "VILLORIA CARLOS MARIO", domicilio: "SAN MARTIN 672", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-10950548-0", tipo: "inscripto", categoria: 1 },
    { id: "44", codigo: 94, nombre: "HEIM RUBEN", domicilio: "PLANTA URBANA", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-13705742-6", tipo: "monotributo", categoria: 3 },
    { id: "45", codigo: 95, nombre: "ROSON GONZALO OSCAR", domicilio: "SAN MARTIN 1377", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05501972-0", tipo: "monotributo", categoria: 2 },
    { id: "46", codigo: 97, nombre: "MARTIN SERGIO DANIEL", domicilio: "COLON Y SARMIENTO", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-20686912-8", tipo: "monotributo", categoria: 2 },
    { id: "47", codigo: 99, nombre: "ROSON GUILLERMO", domicilio: "SAN MARTIN 1414", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-20316920-6", tipo: "inscripto", categoria: 1 },
    { id: "48", codigo: 100, nombre: "TRABUCCO GABRIELA", domicilio: "9 DE JULIO S/N", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-23942356-1", tipo: "monotributo", categoria: 2 },
    { id: "49", codigo: 102, nombre: "TRANIER TERESITA ALESI", domicilio: "ERIZE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-02758172-8", tipo: "monotributo", categoria: 3 },
    { id: "50", codigo: 103, nombre: "LA CANAZAYA S.A.", domicilio: "25 DE MAYO 881", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-70760230-5", tipo: "monotributo", categoria: 2 },
    { id: "51", codigo: 104, nombre: "ITCHART RUBEN DANIEL", domicilio: "MORENO 915", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-20316842-0", tipo: "inscripto", categoria: 1 },
    { id: "52", codigo: 106, nombre: "BACIGALUPO ANDREA SUSANA", domicilio: "MORENO 1035", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-23624291-4", tipo: "inscripto", categoria: 1 },
    { id: "53", codigo: 107, nombre: "CAHUE AGROPECUARIA S.A.", domicilio: "IRIGOYEN 420", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-70802682-0", tipo: "monotributo", categoria: 2 },
    { id: "54", codigo: 108, nombre: "CANERO JAQUELINA", domicilio: "DORREGO 1055", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-20691746-1", tipo: "inscripto", categoria: 1 },
    { id: "55", codigo: 109, nombre: "CANERO MARIO ALBERTO", domicilio: "MITRE 855", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05176469-3", tipo: "inscripto", categoria: 1 },
    { id: "56", codigo: 111, nombre: "CAYSSIALS GUILLERMO JORGE", domicilio: "IRIGOYEN 420", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-10238588-9", tipo: "monotributo", categoria: 2 },
    { id: "57", codigo: 112, nombre: "COOP.AGR.GAN.LTDA.DE GARRE", domicilio: "GARRE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-53426420-4", tipo: "monotributo", categoria: 2 },
    { id: "58", codigo: 114, nombre: "DABE S.A.", domicilio: "SAN MARTIN 1100", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-55078063-8", tipo: "monotributo", categoria: 2 },
    { id: "59", codigo: 117, nombre: "GONZALEZ SERGIO GABRIEL", domicilio: "SAN MARTIN 1100", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-21058750-1", tipo: "monotributo", categoria: 2 },
    { id: "60", codigo: 118, nombre: "GUIDO CECILIA NOEMI", domicilio: "PRINGLES", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-21862654-3", tipo: "inscripto", categoria: 1 },
    { id: "61", codigo: 120, nombre: "IRIFOL S.A.", domicilio: "25 DE MAYO 881", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-70817962-7", tipo: "monotributo", categoria: 2 },
    { id: "62", codigo: 121, nombre: "LANZILOTTA MARCELO RUBEN", domicilio: "SARMIENTO 735", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-16912979-8", tipo: "inscripto", categoria: 1 },
    { id: "63", codigo: 122, nombre: "MARQUEZ MARIA ROMINA", domicilio: "SAN MARTIN 657", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-23258270-2", tipo: "inscripto", categoria: 1 },
    { id: "64", codigo: 123, nombre: "ENRIQUE MORO S.A.", domicilio: "MORENO 287", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-70819498-7", tipo: "monotributo", categoria: 2 },
    { id: "65", codigo: 125, nombre: "RAFFIN ELENA RAQUEL", domicilio: "RIVADAVIA 737", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-03956029-7", tipo: "monotributo", categoria: 3 },
    { id: "66", codigo: 127, nombre: "SAGASTI ALDO EVARISTO", domicilio: "COLON 1033", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05452113-9", tipo: "inscripto", categoria: 4 },
    { id: "67", codigo: 128, nombre: "SAGASTI GUILLERMO RICARDO", domicilio: "COLON 1033", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-16547501-2", tipo: "inscripto", categoria: 4 },
    { id: "68", codigo: 129, nombre: "SARSUR JORGE SUC.", domicilio: "25 DE MAYO 881", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-13705230-0", tipo: "monotributo", categoria: 2 },
    { id: "69", codigo: 132, nombre: "CENTRO EMPLEADOS DE COMERCIO", domicilio: "COLON 967", localidad: "Carhue", provincia: "Buenos Aires", cuit: "33-66463531-9", tipo: "inscripto", categoria: 4 },
    { id: "70", codigo: 133, nombre: "FRAYSSE MABEL BEATRIZ", domicilio: "PELLEGRINI 555", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-13075621-8", tipo: "inscripto", categoria: 1 },
    { id: "71", codigo: 136, nombre: "CAMIO PABLO EDUARDO", domicilio: "COLON 802", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-22944129-9", tipo: "monotributo", categoria: 2 },
    { id: "72", codigo: 137, nombre: "FIGUEROA FERNANDO EDUARDO", domicilio: "AVELLANEDA 857", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-22855563-1", tipo: "inscripto", categoria: 1 },
    { id: "73", codigo: 139, nombre: "CILLEY S.A.", domicilio: "MORENO 757", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-70893479-4", tipo: "monotributo", categoria: 2 },
    { id: "74", codigo: 141, nombre: "SCHMIDT ELISABET", domicilio: "URQUIZA 705", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-21979715-5", tipo: "inscripto", categoria: 1 },
    { id: "75", codigo: 142, nombre: "CANERO ALEJANDRA", domicilio: "ALSINA 667", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-24494904-0", tipo: "inscripto", categoria: 1 },
    { id: "76", codigo: 144, nombre: "MUZIO ALEJANDRO", domicilio: "AV,COLON 76 P3", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-07646213-6", tipo: "monotributo", categoria: 2 },
    { id: "77", codigo: 145, nombre: "LACOMBE JULIO OSVALDO", domicilio: "CUARTEL 3 ERIZE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-31137838-5", tipo: "inscripto", categoria: 1 },
    { id: "78", codigo: 147, nombre: "SCHMIDT ADRIAN MARCELO", domicilio: "YRIGOYEN 1645", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-22482745-9", tipo: "inscripto", categoria: 1 },
    { id: "79", codigo: 148, nombre: "ELIZONDO MONICA PATRICIA", domicilio: "COLON 1287", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-16547545-9", tipo: "monotributo", categoria: 2 },
    { id: "80", codigo: 149, nombre: "INCHAUSPE OSCAR PEDRO", domicilio: "BARRIO ILLIA CASA154", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-14528129-7", tipo: "monotributo", categoria: 2 },
    { id: "81", codigo: 150, nombre: "DURAN SUSANA CRISTINA", domicilio: "COLON 828", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-10572111-6", tipo: "inscripto", categoria: 1 },
    { id: "82", codigo: 151, nombre: "GOTTE WALTER EDGARDO", domicilio: "ALSINA 1475", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-13705337-4", tipo: "inscripto", categoria: 1 },
    { id: "83", codigo: 152, nombre: "MUZIO ESTEBAN MARTIN", domicilio: "VILLA CARLOS PAZ", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-25581663-3", tipo: "monotributo", categoria: 2 },
    { id: "84", codigo: 154, nombre: "BLACHET ARIEL VICTOR", domicilio: "COLON 1084", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-23431501-4", tipo: "inscripto", categoria: 1 },
    { id: "85", codigo: 156, nombre: "LASPIUR JUAN CARLOS", domicilio: "MITRE 1295", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-20316999-0", tipo: "inscripto", categoria: 1 },
    { id: "86", codigo: 160, nombre: "INCHAUSPE DANIEL HORACIO", domicilio: "MITRE 1281", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-28969938-5", tipo: "inscripto", categoria: 1 },
    { id: "87", codigo: 161, nombre: "FARMACIA SARSUR S.C.S.", domicilio: "PUEYRREDON 598", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71149654-4", tipo: "monotributo", categoria: 2 },
    { id: "88", codigo: 162, nombre: "IRISARRI AGUSTIN NICASIO", domicilio: "25 DE MAYO 881", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-11377134-9", tipo: "monotributo", categoria: 2 },
    { id: "89", codigo: 163, nombre: "DAUWALDER VERONICA ANALIA", domicilio: "RIVADAVIA 1494", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-26704258-1", tipo: "inscripto", categoria: 1 },
    { id: "90", codigo: 164, nombre: "ROBILOTTE BETTINA", domicilio: "COLON 1084", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-24168070-9", tipo: "inscripto", categoria: 1 },
    { id: "91", codigo: 165, nombre: "TRECCO LUIS ENRIQUE", domicilio: "BELGRANO 760", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-14528215-3", tipo: "monotributo", categoria: 2 },
    { id: "92", codigo: 166, nombre: "VOLPE LAURA MARIA CRISTINA", domicilio: "COLON 1010", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-16525407-4", tipo: "inscripto", categoria: 1 },
    { id: "93", codigo: 167, nombre: "MARINO BEATRIZ CECILIA", domicilio: "RIVADAVIA 2093", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-13993799-1", tipo: "inscripto", categoria: 1 },
    { id: "94", codigo: 168, nombre: "URRIZA NILDA SUSANA", domicilio: "SAN MARTIN 1156", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-03981972-4", tipo: "inscripto", categoria: 1 },
    { id: "95", codigo: 169, nombre: "FERNANDEZ PATRICIA LEONOR", domicilio: "SARMIENTO 536", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-13993679-0", tipo: "inscripto", categoria: 1 },
    { id: "96", codigo: 170, nombre: "FANCIOTTI AILDA MARIA VALERIA", domicilio: "CARHUE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-02695977-8", tipo: "inscripto", categoria: 1 },
    { id: "97", codigo: 171, nombre: "TRABUCCO CARLOS", domicilio: "SAN MIGUEL", localidad: "Carhue", provincia: "Buenos Aires", cuit: "24-30648181-5", tipo: "inscripto", categoria: 1 },
    { id: "98", codigo: 173, nombre: "FRANCISCO SEXTO S.R.L.", domicilio: "CAMPOS AV1419 P16 B", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71190222-4", tipo: "monotributo", categoria: 2 },
    { id: "99", codigo: 174, nombre: "FERNANDEZ SILVIA ANAHI", domicilio: "ALEM 612", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-20049263-9", tipo: "monotributo", categoria: 2 },
    { id: "100", codigo: 175, nombre: "DAUWALDER ROCIO SOLEDAD", domicilio: "YRIGOYEN Y RIVADAVIA", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-34945698-8", tipo: "monotributo", categoria: 3 },
    { id: "101", codigo: 176, nombre: "AGRUP.CAMPONUEVO S.A.", domicilio: "MORENO Y EUGUI", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-70867926-3", tipo: "monotributo", categoria: 2 },
    { id: "102", codigo: 177, nombre: "ASOC.BOMBEROS VILLA MAZA", domicilio: "VILLA MAZA", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-66467540-0", tipo: "monotributo", categoria: 3 },
    { id: "103", codigo: 178, nombre: "ASOC.COOP.CHACRA EXPERIMENTAL", domicilio: "CARHUE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-66464305-3", tipo: "monotributo", categoria: 2 },
    { id: "104", codigo: 179, nombre: "ATENEO FLORENTINO AMEGHINO", domicilio: "CARHUE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "33-71015934-9", tipo: "monotributo", categoria: 3 },
    { id: "105", codigo: 180, nombre: "COOPERATIVA DE TRABAJO EL CRIS", domicilio: "CARHUE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-70965328-4", tipo: "monotributo", categoria: 2 },
    { id: "106", codigo: 181, nombre: "GONZALEZ RODOLFO ADON", domicilio: "BAHIA BLANCA", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-04283835-8", tipo: "monotributo", categoria: 2 },
    { id: "107", codigo: 182, nombre: "MELONI ADRIAN ALFREDO", domicilio: "CARHUE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-13993739-3", tipo: "monotributo", categoria: 2 },
    { id: "108", codigo: 183, nombre: "MORO MARIANO AGUSTIN", domicilio: "CARHUE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-27761341-8", tipo: "inscripto", categoria: 1 },
    { id: "109", codigo: 184, nombre: "PICHI PUL S.A.", domicilio: "COLON 1302", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71204058-7", tipo: "monotributo", categoria: 2 },
    { id: "110", codigo: 185, nombre: "SANCHEZ ANDRES", domicilio: "BELGRANO 760", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05422370-7", tipo: "monotributo", categoria: 2 },
    { id: "111", codigo: 186, nombre: "SERVICIOS CARHUE S.R.L.", domicilio: "COLON Y SAN MARTIN", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71066035-9", tipo: "monotributo", categoria: 2 },
    { id: "112", codigo: 187, nombre: "PAGGI GUILLERMO ARIEL", domicilio: "PEDRO GALLO 743", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-20316912-5", tipo: "monotributo", categoria: 2 },
    { id: "113", codigo: 188, nombre: "ROBILOTTE EMANUEL", domicilio: "RIVADAVIA 1494", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-27-110074-", tipo: "monotributo", categoria: 2 },
    { id: "114", codigo: 189, nombre: "GITLEIN VIVIANA ALEJANDRA", domicilio: "SAN MARTIN 745", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-30832788-4", tipo: "inscripto", categoria: 1 },
    { id: "115", codigo: 190, nombre: "PATTHAUER GUSTAVO ALFREDO", domicilio: "ALBERTI 665", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-16606423-7", tipo: "monotributo", categoria: 2 },
    { id: "116", codigo: 191, nombre: "GOTTE CLAUDIA VANESA", domicilio: "MORENO 989", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-33483342-4", tipo: "inscripto", categoria: 1 },
    { id: "117", codigo: 192, nombre: "MONZA NEUMATICOS S.A.", domicilio: "COLON 766", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71245183-8", tipo: "monotributo", categoria: 2 },
    { id: "118", codigo: 193, nombre: "GOMERIAS MONZA S.A.", domicilio: "H.YRIGOYEN 1990", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71244836-5", tipo: "monotributo", categoria: 2 },
    { id: "119", codigo: 194, nombre: "ARGYROS S.A.", domicilio: "URQUIZA 313", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-70771515-0", tipo: "monotributo", categoria: 2 },
    { id: "120", codigo: 195, nombre: "MERA CARHUE AGROPECUARIA S.A.", domicilio: "BELGRANO 999", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71254621-9", tipo: "monotributo", categoria: 2 },
    { id: "121", codigo: 196, nombre: "MOLINA HECTOR OSVALDO", domicilio: "25 DE MAYO 960", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-14903928-8", tipo: "monotributo", categoria: 2 },
    { id: "122", codigo: 197, nombre: "OBERMATERIAL S.H.", domicilio: "TAUS 0", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71254213-2", tipo: "monotributo", categoria: 2 },
    { id: "123", codigo: 198, nombre: "ROBILOTTE MARTIN", domicilio: "CARHUE", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-25356064-9", tipo: "inscripto", categoria: 1 },
    { id: "124", codigo: 199, nombre: "KREDER MARCELO ENRIQUE", domicilio: "ALVEAR 780", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-20063358-0", tipo: "inscripto", categoria: 1 },
    { id: "125", codigo: 201, nombre: "SEQUEIRA MARTIN ARMANDO", domicilio: "SAN MARTIN 693", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-32701006-9", tipo: "inscripto", categoria: 1 },
    { id: "126", codigo: 202, nombre: "LOPEZ HECTOR", domicilio: "URQUIZA 313", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-12230830-9", tipo: "inscripto", categoria: 1 },
    { id: "127", codigo: 203, nombre: "MATEUS MARCELA", domicilio: "MITRE 669", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-17360647-3", tipo: "inscripto", categoria: 1 },
    { id: "128", codigo: 205, nombre: "NARBAITZ ENRIQUE CARLOS", domicilio: "SAN MARTIN 1167", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-08311642-1", tipo: "inscripto", categoria: 1 },
    { id: "129", codigo: 206, nombre: "FERRANDO PEDRO OSCAR", domicilio: "MITRE 739", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05452105-8", tipo: "inscripto", categoria: 1 },
    { id: "130", codigo: 207, nombre: "OTERO MATIAS JOSE", domicilio: "ALSINA E YRIGOYEN", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-22049720-9", tipo: "inscripto", categoria: 1 },
    { id: "131", codigo: 208, nombre: "BOFFA NORA ELBA", domicilio: "SAN MARTIN 1110", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-10950569-8", tipo: "inscripto", categoria: 1 },
    { id: "132", codigo: 209, nombre: "MILLA LAUTARO HECTOR", domicilio: "BELGRANO 743", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-25356079-8", tipo: "monotributo", categoria: 2 },
    { id: "133", codigo: 210, nombre: "FITTIPALDI HILDA MARIA", domicilio: "9 DE JULIO S/N", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-05764346-9", tipo: "inscripto", categoria: 1 },
    { id: "134", codigo: 211, nombre: "FERNANDEZ SERGIO ARIEL", domicilio: "JOSE HERNANDEZ 249", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-17067111-3", tipo: "monotributo", categoria: 2 },
    { id: "135", codigo: 212, nombre: "LAUMANN RICARDO RAUL", domicilio: "CUARTEL 3", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-16722055-0", tipo: "monotributo", categoria: 2 },
    { id: "136", codigo: 213, nombre: "LAUMANN EDUARDO MARCELINO", domicilio: "CUARTEL 3", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-11721031-7", tipo: "monotributo", categoria: 2 },
    { id: "137", codigo: 217, nombre: "YEREGUI MARIA CRISTINA", domicilio: "CUARTEL 10", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-03745754-5", tipo: "inscripto", categoria: 1 },
    { id: "138", codigo: 218, nombre: "VAZQUEZ CECILIA ESTELA", domicilio: "PUEYRREDON 545", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-31137900-9", tipo: "inscripto", categoria: 1 },
    { id: "139", codigo: 219, nombre: "TRABUCCO CARLOS ATILIO", domicilio: "9 DE JULIO S/N", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05500344-1", tipo: "inscripto", categoria: 1 },
    { id: "140", codigo: 220, nombre: "SARSUR YANIRA", domicilio: "ALSINA 612", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-31826844-4", tipo: "inscripto", categoria: 1 },
    { id: "141", codigo: 221, nombre: "MONTENEGRO CAROLINA", domicilio: "SARMIENTO 898", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-25872502-1", tipo: "monotributo", categoria: 2 },
    { id: "142", codigo: 222, nombre: "FERNANDEZ MARIA INES", domicilio: "LOMAS VALENTINAS", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-10406013-2", tipo: "inscripto", categoria: 1 },
    { id: "143", codigo: 225, nombre: "FERRANDO ROSANA NORA", domicilio: "LAPRIDA 996", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-16547595-5", tipo: "monotributo", categoria: 2 },
    { id: "144", codigo: 226, nombre: "GARCIA ALONSO JUAN PABLO", domicilio: "COLON 1138", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-31826968-9", tipo: "inscripto", categoria: 1 },
    { id: "145", codigo: 227, nombre: "SALSOLA KALI S.A.", domicilio: "ALSINA 77", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71508834-3", tipo: "monotributo", categoria: 2 },
    { id: "146", codigo: 228, nombre: "PASO DEL MOJON S.A.", domicilio: "SARMIENTO 817", localidad: "Carhue", provincia: "Buenos Aires", cuit: "33-71502843-9", tipo: "monotributo", categoria: 2 },
    { id: "147", codigo: 229, nombre: "URRUSTARAZU MARIA JULIETA", domicilio: "ALSINA 620", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-34170794-9", tipo: "inscripto", categoria: 1 },
    { id: "148", codigo: 231, nombre: "RAGGI CARLOS ARIEL", domicilio: "PUEYRREDON 836", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-26102886-8", tipo: "monotributo", categoria: 2 },
    { id: "149", codigo: 232, nombre: "SUC. FERNANDEZ RUBEN ANGEL", domicilio: "YRIGOYEN 526", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05248034-6", tipo: "monotributo", categoria: 3 },
    { id: "150", codigo: 235, nombre: "HEIM LIDIA IRENE", domicilio: "ALVEAR 730", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-22482631-7", tipo: "inscripto", categoria: 1 },
    { id: "151", codigo: 237, nombre: "ROSSO CRISTINA", domicilio: "CUARTEL X", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-16715882-5", tipo: "inscripto", categoria: 1 },
    { id: "152", codigo: 238, nombre: "ACTIS GORETTA GUSTAVO DANIEL", domicilio: "ALSINA 397", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-18051685-9", tipo: "monotributo", categoria: 2 },
    { id: "153", codigo: 239, nombre: "MILCAM AGROPECUARIA S.A.", domicilio: "BELGRANO 750", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71548795-7", tipo: "monotributo", categoria: 2 },
    { id: "154", codigo: 240, nombre: "MONTEAVARO SERGIO  RAUL", domicilio: "PELLEGRINI 555", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-14270937-7", tipo: "inscripto", categoria: 1 },
    { id: "155", codigo: 241, nombre: "ROBILOTTE OSVALDO RUBEN", domicilio: "MITRE 1680", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05487594-1", tipo: "inscripto", categoria: 1 },
    { id: "156", codigo: 242, nombre: "ARRARAS LUCIANO EDUARDO", domicilio: "RIVADAVIA 255", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-31779865-3", tipo: "inscripto", categoria: 1 },
    { id: "157", codigo: 243, nombre: "DON PACHO AGROSER.AGROP. S.R.L", domicilio: "RIVADAVIA 945", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71598770-4", tipo: "monotributo", categoria: 2 },
    { id: "158", codigo: 245, nombre: "MELONI MATIAS", domicilio: "QUINQUELA MARTIN", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-33483329-2", tipo: "inscripto", categoria: 1 },
    { id: "159", codigo: 246, nombre: "SANCHEZ ADRIAN", domicilio: "ALSINA 185", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-26102854-9", tipo: "monotributo", categoria: 2 },
    { id: "160", codigo: 247, nombre: "CAZENAVE RICARDO DANIEL", domicilio: "COLON 669", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-14977958-3", tipo: "inscripto", categoria: 1 },
    { id: "161", codigo: 248, nombre: "D ALESANDRO JOSE ANTONIO", domicilio: "RIVADAVIA 399", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-10769698-9", tipo: "inscripto", categoria: 1 },
    { id: "162", codigo: 249, nombre: "VIDAL MAURICIO ARIEL", domicilio: "COLON 1275", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-24003446-9", tipo: "inscripto", categoria: 1 },
    { id: "163", codigo: 251, nombre: "BARAGRO SOCIEDAD SIMPLE", domicilio: "DORREGO 1357", localidad: "Carhue", provincia: "Buenos Aires", cuit: "30-71642999-3", tipo: "monotributo", categoria: 2 },
    { id: "164", codigo: 252, nombre: "RIVAS GUSTAVO FABIAN", domicilio: "URQUIZA 544", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-30249548-4", tipo: "inscripto", categoria: 1 },
    { id: "165", codigo: 253, nombre: "LESCANO CARLA NAZARENA", domicilio: "ALVEAR 1170", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-36362188-6", tipo: "inscripto", categoria: 1 },
    { id: "166", codigo: 254, nombre: "SAGASTI ELSIE NORA", domicilio: "MITRE 739", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-03774302-5", tipo: "inscripto", categoria: 1 },
    { id: "167", codigo: 255, nombre: "PAGGI DEMES ALBERTO RAUL", domicilio: "LIBERTAD S/N", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-39288590-1", tipo: "inscripto", categoria: 1 },
    { id: "168", codigo: 256, nombre: "SCHWAB MATIAS ENZO", domicilio: "SARMIENTO 494", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-36895918-9", tipo: "monotributo", categoria: 2 },
    { id: "169", codigo: 257, nombre: "PENNA GUSTAVO RAUL", domicilio: "COLON 1398", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-17777663-8", tipo: "inscripto", categoria: 1 },
    { id: "170", codigo: 258, nombre: "ROSON CRISTIAN JAVIER", domicilio: "DORREGO 935", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-23624236-7", tipo: "inscripto", categoria: 1 },
    { id: "171", codigo: 259, nombre: "OTERO EDUARDO ALFREDO", domicilio: "COLON 1056", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-12839729-9", tipo: "inscripto", categoria: 1 },
    { id: "172", codigo: 260, nombre: "ALVAREZ VICTOR MAXIMILIANO", domicilio: "SARMIENTO 368", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-33483231-8", tipo: "inscripto", categoria: 1 },
    { id: "173", codigo: 261, nombre: "LETE CLAUDIA LORENA", domicilio: "ALVEAR 525", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-24999763-9", tipo: "inscripto", categoria: 1 },
    { id: "174", codigo: 262, nombre: "MARTINS ROQUE DIEGO", domicilio: "25 DE MAYO 1480", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-36754200-5", tipo: "inscripto", categoria: 1 },
    { id: "175", codigo: 264, nombre: "SEGABACHE MARIA ELVIRA", domicilio: "COLON 1165", localidad: "Carhue", provincia: "Buenos Aires", cuit: "23-03304811-4", tipo: "inscripto", categoria: 1 },
    { id: "176", codigo: 265, nombre: "GONZALEZ LAURA KARINA", domicilio: "AVELLANEDA 733", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-22004370-9", tipo: "inscripto", categoria: 1 },
    { id: "177", codigo: 266, nombre: "FERREYRA ALEXANDER LEONEL", domicilio: "B.SOLIDARIDAD II 84", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-35235540-3", tipo: "inscripto", categoria: 1 },
    { id: "178", codigo: 267, nombre: "ACTIS GORETTA GUSTAVO EMANUEL", domicilio: "ALSINA 395", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-34170708-1", tipo: "inscripto", categoria: 1 },
    { id: "179", codigo: 268, nombre: "ALONSO VILMA MARISA", domicilio: "SALINAS GRANDES 1172", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-16547509-2", tipo: "inscripto", categoria: 1 },
    { id: "180", codigo: 269, nombre: "NUESCH GUILLERMO RODOLFO", domicilio: "SARMIENTO 898", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-25356083-6", tipo: "inscripto", categoria: 1 },
    { id: "181", codigo: 270, nombre: "ALVAREZ MAURO CESAR", domicilio: "9 DE JULIO 0", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-31231258-2", tipo: "monotributo", categoria: 2 },
    { id: "182", codigo: 271, nombre: "ARIAS ABEL ARNOLDO", domicilio: "SAN MARTIN 1156", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-05463427-8", tipo: "inscripto", categoria: 1 },
    { id: "183", codigo: 273, nombre: "MAUGERI CLARA", domicilio: "AVELLANEDA 976", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-40944010-5", tipo: "inscripto", categoria: 1 },
    { id: "184", codigo: 275, nombre: "VAZQUEZ NORA", domicilio: "SAN MARTIN 1000", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-16604844-9", tipo: "monotributo", categoria: 2 },
    { id: "185", codigo: 277, nombre: "MONTENEGRO JULIANA", domicilio: "MITRE 1315", localidad: "Carhue", provincia: "Buenos Aires", cuit: "27-26845660-6", tipo: "monotributo", categoria: 2 },
    { id: "186", codigo: 279, nombre: "VERCELLINO MARCOS DANIEL", domicilio: "SARMIENTO 845", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-31151681-8", tipo: "monotributo", categoria: 2 },
    { id: "187", codigo: 281, nombre: "FERNANDEZ ROBERTO OSCAR", domicilio: "MITRE 757", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-12230867-8", tipo: "monotributo", categoria: 2 },
    { id: "188", codigo: 282, nombre: "BILBAO RAUL ALFREDO", domicilio: "AVELLANEDA 959", localidad: "Carhue", provincia: "Buenos Aires", cuit: "20-16848222-2", tipo: "monotributo", categoria: 2 },
    { id: "189", codigo: 283, nombre: "ELIZONDO SUSANA", domicilio: "", localidad: "Carhue", provincia: "Buenos Aires", cuit: "", tipo: "inscripto", categoria: 1 }
];

export function ClientesView() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [clientes, setClientes] = React.useState<ClienteWithId[]>(initialClientes)
  const [selectedCliente, setSelectedCliente] = React.useState<ClienteWithId | null>(null);
  const [clienteToDelete, setClienteToDelete] = React.useState<ClienteWithId | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const clientesData = await getClientes();
      // If firestore is empty, use initial data. Otherwise, use firestore data.
      if (clientesData.length === 0) {
          // One-time seeding of Firestore
          const seedPromises = initialClientes.map(c => addCliente(c));
          await Promise.all(seedPromises);
          setClientes(initialClientes);
      } else {
          setClientes(clientesData);
      }
    } catch (error) {
      console.error("Error fetching or seeding clientes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
      // Fallback to initial data if firestore fails
      setClientes(initialClientes);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchClientes();
  }, []);

  const handleSaveCliente = async (cliente: Cliente) => {
    try {
      if (selectedCliente) {
        await updateCliente(selectedCliente.id, cliente);
        toast({
          title: "Cliente Actualizado",
          description: "El cliente ha sido actualizado correctamente.",
        });
      } else {
        await addCliente(cliente);
        toast({
          title: "Cliente Creado",
          description: "El cliente ha sido creado correctamente.",
        });
      }
      fetchClientes(); // Refresh data
      setIsDialogOpen(false);
      setSelectedCliente(null);
    } catch (error) {
       console.error("Error saving cliente:", error);
       toast({
        title: "Error",
        description: "No se pudo guardar el cliente.",
        variant: "destructive",
      });
    }
  }
  
  const handleEdit = (cliente: ClienteWithId) => {
    setSelectedCliente(cliente);
    setIsDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedCliente(null);
    setIsDialogOpen(true);
  }

  const openDeleteDialog = (cliente: ClienteWithId) => {
    setClienteToDelete(cliente);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteCliente = async () => {
    if (!clienteToDelete) return;
    try {
      await deleteCliente(clienteToDelete.id);
      toast({
        title: 'Cliente Eliminado',
        description: `El cliente "${clienteToDelete.nombre}" ha sido eliminado.`,
      });
      fetchClientes(); // Refresh data
    } catch (error) {
      console.error("Error deleting cliente:", error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cliente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setClienteToDelete(null);
    }
  };


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de Clientes</h2>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2" />
          Nuevo Cliente
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Cargando clientes...</TableCell>
              </TableRow>
            ) : clientes.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center">No hay clientes para mostrar.</TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.codigo}</TableCell>
                  <TableCell className="font-medium">{cliente.nombre}</TableCell>
                  <TableCell>{cliente.cuit}</TableCell>
                  <TableCell>
                    <Badge variant={cliente.tipo === 'inscripto' ? "secondary" : "default"}>
                      {cliente.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Cat. {cliente.categoria}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => openDeleteDialog(cliente)}>
                           <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {isDialogOpen && (
        <ClienteDialog 
          isOpen={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSave={handleSaveCliente} 
          cliente={selectedCliente}
        />
      )}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente
               "{clienteToDelete?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCliente}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
