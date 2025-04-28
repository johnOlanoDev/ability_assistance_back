import {injectable} from "tsyringe";


@injectable()
export class UserValidator {

    constructor(
       /*  @inject("UserRepository") private userRepository: UserRepository,
        @inject("DocumentTypeService") private documentTypeService: DocumentTypeService,
        @inject("WorkplaceService") private workplaceService: WorkplaceService,
        @inject("PositionService") private positionService: PositionService,
        @inject("CompanyService") private companyService: CompanyService, */
    ) {}

    /* // Validar que la compañia exista
    async validateCompanyExists(user:{ roleId: string, companyId?:string}): Promise<void> {
        if (companyId) {
            const company = await this.companyService.getCompanyById(companyId);
            if (!company) {
                throw new AppError("La empresa no existe", 404);
            }
        }
    }

    // Validar que el usuario exista por compañía
    async validateExistsUser(id: string, companyId?: string): Promise<void> {
        const userId = await this.userRepository.getUserByIdCompany(id, companyId);
        if (!userId) throw new AppError(`Usuario ${userId} no encontrado. Vuelva a intentarlo`);

        if(!userId.companyId && userId.name !== "Superadmin") {
            throw new AppError("Usuario inválido: Todos los usuarios deben pertenecer a una empresa", 400);
        }
    }


    // Validar que el usuario con el email exista en la compañia
    async validateExistsUserByEmail(email: string, companyId?: string): Promise<void> {
        const userEmail = await this.userRepository.findByEmailByCompany(email, companyId);
        if (!userEmail) throw new AppError(`Usuario ${email} no encontrado. Vuelva a intentarlo`);
        if(!userEmail.companyId && userEmail.name !== "Superadmin") {
            throw new AppError("Usuario inválido: Todos los usuarios deben pertenecer a una empresa", 400);
        }
    }

    // Validar que el email del usuario exista en esa compañia
    async validateDuplicatedEmailInCompany(email: string, companyId?: string,): Promise<void> {
        const userEmail = await this.userRepository.findByEmailByCompany(email, companyId);
        if (userEmail) throw new AppError(`El email ${email} ya está en uso. Vuelva a intentarlo`, 400);
        
    }
    
    async validateExistsNumberDocumentInCompany(numberDocument: string, companyId?: string,): Promise<void> {
        const userNumberDocument = await this.userRepository.findByNumberDocumentByCompany(numberDocument, companyId);
        if (userNumberDocument) {
            throw new AppError(`El número de documento ${numberDocument} ya está en uso. Vuelva a intentarlo`, 400);
        }
    }
    
    async validateDocumentTypeInCompany(documentTypeName: string, companyId?: string,): Promise<void> {
        const documentType = await this.userRepository.findByDocumentTypeName(documentTypeName, companyId);
        if (!documentType) {
            throw new AppError(`El tipo de documento ${documentTypeName} no existe. Vuelva a intentarlo`, 400);
        }
        
    }
    

    async validateDocumentTypeExistsInCompany(documentTypeId: string, user:{ roleId: string, companyId?:string},): Promise<void> {
        
        const documentType = await this.documentTypeService.getDocumentTypeById(documentTypeId, user.companyId);
       
        if (!documentType)  throw new AppError(`El tipo de documento ${documentTypeId} no existe. Vuelva a intentarlo`, 400);
        
        
    }

    async validateWorkplaceInCompany(workplaceId: string, user:{ roleId: string, companyId?:string},): Promise<void> {
        if (companyId) {
            const workplace = await this.workplaceService.getWorkplaceById(workplaceId, companyId);
            if (!workplace) {
                throw new AppError(`El área de trabajo ${workplaceId} no existe. Vuelva a intentarlo`, 400);
            }
        }
    }
    
    async validatePositionInCompany(positionId: string, user:{ roleId: string, companyId?:string},): Promise<void> {
        if (companyId) {
            const position = await this.positionService.getPositionById(positionId);
            if (!position) {
                throw new AppError(`El cargo ${positionId} no existe. Vuelva a intentarlo`, 400);
            }
        }
    }

    // Validar contraseñas 
    async validatePasswords(password: string, confirmPassword: string): Promise<void> {
        if (password !== confirmPassword) {
            throw new AppError("Las contraseñas no coinciden", 400);
        }
    }

    async validateEmailUniqueness(email: string, companyId?: string, excludeUserId?: string): Promise<void> {
        if (companyId) {
            const existingUser = await this.userRepository.findByEmailByCompany(companyId, email);
            if (existingUser && existingUser.id !== excludeUserId) {
                throw new AppError(`El email ${email} ya está en uso. Vuelva a intentarlo`, 400);
            }
        }
    }

    // Buscar usuarios por nombres o apellidos
    async findUserNameByCompany(companyId: string, name: string): Promise<void> {

        const users = await this.userRepository.findUserNameByCompany(companyId, name);
        const userName = users && users.find(user => user.name === name);
        const userLastName = users && users.find(user => user.lastName === name);


        if(!userName || !userLastName) 
            throw new AppError(`Usuario ${userName} ${userLastName} no encontrado`, 404);
        
        
    }

    // Validar fecha de nacimiento del usuario a registrar
    async validateBirthDate(birthDate: Date): Promise<void> {
        const currentDate = new Date();
        const birthDateUser = new Date(birthDate);
        const age = currentDate.getFullYear() - birthDateUser.getFullYear();
        
        // Validar que usuarios sean mayores de edad
        if (age < 18) {
            throw new AppError("Debes ser mayor de edad para registrarte", 400);
        }

        if (age > 100) {
            throw new AppError("La edad no puede ser mayor a 100 años", 400);
        }

        // Validar que el usuario no pueda registrar la fecha mayor a la actual
        if (birthDateUser > currentDate) {
            throw new AppError("La fecha de nacimiento no puede ser mayor a la actual", 400);
        }
    }

    async validateStatusBoolean(status: boolean): Promise<void> {
        if(typeof status !== "boolean") {
            throw new AppError("El estado debe ser un valor booleano", 400);
        }
    }

    // Validar que el email del usuario a actualizar no se encuentre en uso
    async validateUserEmailUniqueIfUpdated(email?: string, companyId?: string, excludeUserId?: string): Promise<void> {

        if (email && companyId) {
            await this.validateCompanyExists(companyId);

            const existingUser = await this.userRepository.findByEmailByCompany(companyId, email);

            if (existingUser && existingUser.id !== excludeUserId) {
                throw new AppError("El email ya está en uso. Vuelva a intentarlo", 400);
            }

        }
    }

    // Validar que el número de documento del usuario a actualizar no se encuentre en uso
    async validateUserNumberDocumentUniqueIfUpdated(numberDocument?: string, companyId?: string, excludeUserId?: string): Promise<void> {

        if (numberDocument && companyId) {
            await this.validateCompanyExists(companyId);

            const existingUser = await this.userRepository.findByNumberDocumentByCompany(companyId, numberDocument);

            if (existingUser && existingUser.id !== excludeUserId) {
                throw new AppError("El número de documento ya está en uso. Vuelva a intentarlo", 400);
            }

        }
    } */
}